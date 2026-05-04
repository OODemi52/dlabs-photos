import { type GeneratorConfig, PORTFOLIO_SECTIONS } from "../constants.js";
import type { PortfolioSection } from "../types.js";
import {
  filenameWithoutExtension,
  idFromImagePath,
  inferOrderFromFilename,
  removeNumericPrefix,
  slugify,
  titleizeSlug,
  uniqueStrings
} from "./slug.js";

export type InferredImageMetadata = {
  id: string;
  path: string;
  src: string;
  alt: string;
  section: PortfolioSection;
  category: string;
  tags: string[];
  order: number;
  collectionSlug?: string;
  collectionTitle?: string;
};

export function inferImageMetadata(
  imagePath: string,
  config: GeneratorConfig
): InferredImageMetadata {
  const segments = imagePath.split("/");
  const section = segments[0];
  const grouping = segments[1];

  if (!isPortfolioSection(section)) {
    throw new Error(`Unknown image section "${section}" inferred from ${imagePath}`);
  }

  if (!grouping) {
    throw new Error(`Expected ${imagePath} to live under ${section}/<category-or-collection>/`);
  }

  const fileTitle = titleizeSlug(removeNumericPrefix(filenameWithoutExtension(imagePath)));
  const defaultOrder = inferOrderFromFilename(imagePath);

  if (section === "events") {
    const collectionSlug = slugify(grouping);
    const collectionTitle = titleizeSlug(grouping);
    const category = collectionSlug;

    return {
      id: idFromImagePath(imagePath),
      path: imagePath,
      src: buildCdnUrl(imagePath, config),
      alt: `${collectionTitle} event photo, ${fileTitle}`,
      section,
      category,
      tags: uniqueStrings([category, "event"]),
      order: defaultOrder,
      collectionSlug,
      collectionTitle
    };
  }

  const category = slugify(grouping);
  const categoryTitle = titleizeSlug(grouping);

  return {
    id: idFromImagePath(imagePath),
    path: imagePath,
    src: buildCdnUrl(imagePath, config),
    alt: `${categoryTitle} portrait, ${fileTitle}`,
    section,
    category,
    tags: [category],
    order: defaultOrder
  };
}

function isPortfolioSection(value: string): value is PortfolioSection {
  return PORTFOLIO_SECTIONS.includes(value as PortfolioSection);
}

function buildCdnUrl(imagePath: string, config: GeneratorConfig) {
  const encodedPath = [config.imageRoot, imagePath]
    .join("/")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${config.cdnBase}/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(
    config.githubRepo
  )}/${encodeURIComponent(config.githubBranch)}/${encodedPath}`;
}
