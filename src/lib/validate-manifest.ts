import { PortfolioManifestSchema, type PortfolioManifest } from "../types.js";

export function validateManifest(manifest: PortfolioManifest) {
  const parsed = PortfolioManifestSchema.parse(manifest);
  const paths = new Set<string>();
  const ids = new Set<string>();
  const imageIds = new Set(parsed.images.map((image) => image.id));

  for (const image of parsed.images) {
    if (paths.has(image.path)) {
      throw new Error(`Duplicate image path: ${image.path}`);
    }

    if (ids.has(image.id)) {
      throw new Error(`Duplicate image id: ${image.id}`);
    }

    if (image.section === "events" && !image.collectionSlug) {
      throw new Error(`Event image ${image.path} is missing collectionSlug`);
    }

    try {
      new URL(image.src);
    } catch {
      throw new Error(`Generated src is malformed for ${image.path}: ${image.src}`);
    }

    paths.add(image.path);
    ids.add(image.id);
  }

  for (const collection of parsed.collections) {
    if (!imageIds.has(collection.coverImageId)) {
      throw new Error(
        `Collection ${collection.slug} references missing cover image id ${collection.coverImageId}`
      );
    }
  }

  return parsed;
}
