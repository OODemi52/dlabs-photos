import path from "node:path";

import type { GeneratorConfig } from "../constants.js";
import type {
  CollectionMetadata,
  ImageMetadata,
  PortfolioCollection,
  PortfolioImage,
  PortfolioManifest,
  PortfolioMetadata
} from "../types.js";
import { inferImageMetadata } from "./infer-metadata.js";
import { uniqueStrings } from "./slug.js";

export type BuildImageInput = {
  imagePath: string;
  contentHash: string;
  config: GeneratorConfig;
  metadata: PortfolioMetadata;
  previousManifest?: PortfolioManifest;
  readGeneratedInfo: (absoluteImagePath: string) => Promise<{
    width: number;
    height: number;
    blurredImageDataUrl: string;
  }>;
};

export async function buildImageEntry({
  imagePath,
  contentHash,
  config,
  metadata,
  previousManifest,
  readGeneratedInfo
}: BuildImageInput): Promise<PortfolioImage> {
  const inferred = inferImageMetadata(imagePath, config);
  const imageMetadata = metadata.images[imagePath] ?? {};
  const previousImage = previousManifest?.images.find(
    (image) => image.path === imagePath && image.contentHash === contentHash
  );

  const generatedInfo = previousImage
    ? {
        width: previousImage.width,
        height: previousImage.height,
        blurredImageDataUrl: previousImage.blurredImageDataUrl
      }
    : await readGeneratedInfo(path.join(config.imageRootDir, imagePath));

  return removeUndefined({
    ...generatedInfo,
    id: inferred.id,
    path: inferred.path,
    src: inferred.src,
    alt: imageMetadata.alt ?? inferred.alt,
    contentHash,
    section: inferred.section,
    category: imageMetadata.category ?? inferred.category,
    tags: imageMetadata.tags ?? inferred.tags,
    order: imageMetadata.order ?? inferred.order,
    featured: imageMetadata.featured,
    collectionSlug: imageMetadata.collectionSlug ?? inferred.collectionSlug,
    collectionTitle: imageMetadata.collectionTitle ?? inferred.collectionTitle,
    shotAt: imageMetadata.shotAt
  });
}

export function buildCollections(
  images: PortfolioImage[],
  metadata: PortfolioMetadata
): PortfolioCollection[] {
  const imagesByPath = new Map(images.map((image) => [image.path, image]));
  const eventImages = images.filter((image) => image.section === "events");
  const groups = groupEventImages(eventImages);

  return [...groups.entries()]
    .map(([slug, group]) => buildCollection(slug, group, metadata.collections[slug], imagesByPath))
    .sort(compareCollections);
}

export function buildMetadataWithStubs(images: PortfolioImage[], metadata: PortfolioMetadata) {
  const nextImages: Record<string, ImageMetadata> = { ...metadata.images };
  const nextCollections: Record<string, CollectionMetadata> = { ...metadata.collections };

  for (const image of images) {
    if (!nextImages[image.path]) {
      nextImages[image.path] = removeUndefined({
        alt: image.alt,
        tags: image.tags,
        order: image.order,
        featured: image.featured,
        category: image.category,
        collectionSlug: image.collectionSlug,
        collectionTitle: image.collectionTitle,
        shotAt: image.shotAt
      });
    }
  }

  for (const collection of buildCollections(images, { ...metadata, images: nextImages })) {
    if (!nextCollections[collection.slug]) {
      const coverImage = images.find((image) => image.id === collection.coverImageId);
      nextCollections[collection.slug] = removeUndefined({
        title: collection.title,
        description: collection.description,
        category: collection.category,
        tags: collection.tags,
        coverImagePath: coverImage?.path,
        order: collection.order,
        shotAt: collection.shotAt
      });
    }
  }

  return {
    images: nextImages,
    collections: nextCollections
  } satisfies PortfolioMetadata;
}

export function sortImages(images: PortfolioImage[]) {
  return [...images].sort((a, b) => {
    const sectionCompare = sectionSortValue(a.section) - sectionSortValue(b.section);

    if (sectionCompare !== 0) {
      return sectionCompare;
    }

    return (
      a.category.localeCompare(b.category) ||
      (a.collectionSlug ?? "").localeCompare(b.collectionSlug ?? "") ||
      a.order - b.order ||
      a.path.localeCompare(b.path)
    );
  });
}

export function withStableGeneratedAt(
  next: Pick<PortfolioManifest, "images" | "collections">,
  previousManifest?: PortfolioManifest
) {
  const nextContent = stableStringify(next);
  const previousContent = previousManifest
    ? stableStringify({
        images: previousManifest.images,
        collections: previousManifest.collections
      })
    : undefined;

  return {
    generatedAt:
      previousManifest && previousContent === nextContent
        ? previousManifest.generatedAt
        : new Date().toISOString(),
    ...next
  } satisfies PortfolioManifest;
}

function buildCollection(
  slug: string,
  images: PortfolioImage[],
  metadata: CollectionMetadata | undefined,
  imagesByPath: Map<string, PortfolioImage>
): PortfolioCollection {
  const sortedImages = [...images].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.order - b.order
  );
  const firstImage = sortedImages[0];

  if (!firstImage) {
    throw new Error(`Cannot build collection ${slug} without images`);
  }

  const coverImage = metadata?.coverImagePath
    ? imagesByPath.get(metadata.coverImagePath)
    : sortedImages[0];

  if (!coverImage) {
    throw new Error(
      `Collection ${slug} references missing cover image path ${metadata?.coverImagePath}`
    );
  }

  const title = metadata?.title ?? firstImage.collectionTitle ?? slug;
  const category = metadata?.category ?? firstImage.category;

  return removeUndefined({
    slug,
    title,
    description: metadata?.description ?? `${title} event photography collection.`,
    category,
    tags: metadata?.tags ?? uniqueStrings([category, "event"]),
    coverImageId: coverImage.id,
    order: metadata?.order ?? firstImage.order,
    shotAt: metadata?.shotAt ?? firstImage.shotAt
  });
}

function groupEventImages(images: PortfolioImage[]) {
  const groups = new Map<string, PortfolioImage[]>();

  for (const image of images) {
    if (!image.collectionSlug) {
      throw new Error(`Event image ${image.path} is missing collectionSlug`);
    }

    const group = groups.get(image.collectionSlug) ?? [];
    group.push(image);
    groups.set(image.collectionSlug, group);
  }

  return groups;
}

function compareCollections(a: PortfolioCollection, b: PortfolioCollection) {
  return a.order - b.order || a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug);
}

function sectionSortValue(section: PortfolioImage["section"]) {
  return section === "portraits" ? 0 : 1;
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
