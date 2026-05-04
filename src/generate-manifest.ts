import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadConfig } from "./constants.js";
import {
  PortfolioManifestSchema,
  PortfolioMetadataSchema,
  type PortfolioManifest,
  type PortfolioMetadata
} from "./types.js";
import { createBlurDataUrl } from "./lib/create-blur-data-url.js";
import { hashFile } from "./lib/hash-file.js";
import {
  buildCollections,
  buildImageEntry,
  buildMetadataWithStubs,
  sortImages,
  withStableGeneratedAt
} from "./lib/merge-manifest.js";
import { readImageInfo } from "./lib/read-image-info.js";
import { scanImages } from "./lib/scan-images.js";
import { formatJson, readJsonIfExists, writeJson } from "./lib/write-json.js";
import { validateManifest } from "./lib/validate-manifest.js";

type CliOptions = {
  check: boolean;
  updateMetadata: boolean;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const metadata = await loadMetadata(config.metadataPath);
  const previousManifest = await readJsonIfExists(config.manifestPath, PortfolioManifestSchema);
  const imagePaths = await scanImages(config);
  const images = await Promise.all(
    imagePaths.map(async (imagePath) => {
      const absoluteImagePath = path.join(config.imageRootDir, imagePath);
      const contentHash = await hashFile(absoluteImagePath);

      return buildImageEntry({
        imagePath,
        contentHash,
        config,
        metadata,
        previousManifest,
        readGeneratedInfo: async (filePath) => {
          const [imageInfo, blurredImageDataUrl] = await Promise.all([
            readImageInfo(filePath),
            createBlurDataUrl(filePath)
          ]);

          return {
            ...imageInfo,
            blurredImageDataUrl
          };
        }
      });
    })
  );

  const sortedImages = sortImages(images);
  const collections = buildCollections(sortedImages, metadata);
  const manifest = validateManifest(
    withStableGeneratedAt(
      {
        images: sortedImages,
        collections
      },
      previousManifest
    )
  );

  if (options.updateMetadata) {
    await writeJson(config.metadataPath, buildMetadataWithStubs(sortedImages, metadata));
  }

  if (options.check) {
    await assertManifestUnchanged(config.manifestPath, manifest);
    console.log("Portfolio manifest is current.");
    return;
  }

  await writeJson(config.manifestPath, manifest);
  console.log(
    `Wrote ${path.relative(config.rootDir, config.manifestPath)} with ${manifest.images.length} images and ${manifest.collections.length} collections.`
  );
}

function parseArgs(args: string[]): CliOptions {
  const knownArgs = new Set(["--check", "--update-metadata"]);
  const unknownArg = args.find((arg) => !knownArgs.has(arg));

  if (unknownArg) {
    throw new Error(`Unknown argument: ${unknownArg}`);
  }

  return {
    check: args.includes("--check"),
    updateMetadata: args.includes("--update-metadata")
  };
}

async function loadMetadata(metadataPath: string): Promise<PortfolioMetadata> {
  return (
    (await readJsonIfExists(metadataPath, PortfolioMetadataSchema)) ?? {
      images: {},
      collections: {}
    }
  );
}

async function assertManifestUnchanged(manifestPath: string, manifest: PortfolioManifest) {
  const current = await readFile(manifestPath, "utf8").catch(() => undefined);
  const next = formatJson(manifest);

  if (current !== next) {
    throw new Error(
      `Generated manifest differs from ${manifestPath}. Run npm run generate and commit the result.`
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
