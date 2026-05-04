import path from "node:path";

export const PORTFOLIO_SECTIONS = ["portraits", "events"] as const;

export const SUPPORTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

export const DEFAULT_ENV = {
  GITHUB_OWNER: "OODemi52",
  GITHUB_REPO: "dlabs-photos",
  GITHUB_BRANCH: "main",
  IMAGE_ROOT: "images",
  CDN_BASE: "https://cdn.statically.io/gh"
} as const;

export type GeneratorConfig = {
  rootDir: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  imageRoot: string;
  imageRootDir: string;
  cdnBase: string;
  manifestDir: string;
  manifestPath: string;
  metadataPath: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env, rootDir = process.cwd()) {
  const imageRoot = trimSlashes(env.IMAGE_ROOT ?? DEFAULT_ENV.IMAGE_ROOT);
  const manifestDir = path.join(rootDir, "manifests");

  return {
    rootDir,
    githubOwner: env.GITHUB_OWNER ?? DEFAULT_ENV.GITHUB_OWNER,
    githubRepo: env.GITHUB_REPO ?? DEFAULT_ENV.GITHUB_REPO,
    githubBranch: env.GITHUB_BRANCH ?? DEFAULT_ENV.GITHUB_BRANCH,
    imageRoot,
    imageRootDir: path.join(rootDir, imageRoot),
    cdnBase: stripTrailingSlash(env.CDN_BASE ?? DEFAULT_ENV.CDN_BASE),
    manifestDir,
    manifestPath: path.join(manifestDir, "portfolio.manifest.json"),
    metadataPath: path.join(manifestDir, "portfolio.metadata.json")
  } satisfies GeneratorConfig;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}
