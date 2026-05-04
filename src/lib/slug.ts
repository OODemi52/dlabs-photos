import path from "node:path";

export function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}

export function stripExtension(filePath: string) {
  return filePath.replace(/\.[^.]+$/, "");
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function idFromImagePath(imagePath: string) {
  return slugify(stripExtension(imagePath).replace(/\//g, "-"));
}

export function filenameWithoutExtension(imagePath: string) {
  return stripExtension(path.posix.basename(imagePath));
}

export function inferOrderFromFilename(imagePath: string) {
  const match = filenameWithoutExtension(imagePath).match(/^(\d+)(?:[-_ ]|$)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function removeNumericPrefix(value: string) {
  return value.replace(/^\d+[-_ ]*/, "");
}

export function titleizeSlug(value: string) {
  const clean = removeNumericPrefix(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!clean) {
    return "Untitled";
  }

  return clean
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
