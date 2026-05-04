import fg from "fast-glob";

import { SUPPORTED_IMAGE_EXTENSIONS, type GeneratorConfig } from "../constants.js";

export async function scanImages(config: GeneratorConfig) {
  const extensionPattern = SUPPORTED_IMAGE_EXTENSIONS.join(",");
  const entries = await fg(`**/*.{${extensionPattern}}`, {
    caseSensitiveMatch: false,
    cwd: config.imageRootDir,
    onlyFiles: true
  });

  return entries.map((entry) => entry.replace(/\\/g, "/")).sort((a, b) => a.localeCompare(b));
}
