# dlabs-photos

Image repository and manifest generator for the D-Labs Photography portfolio.

The generated manifest is written to `manifests/portfolio.manifest.json` and is meant to replace the temporary marketing-site manifest at `config/portfolio-manifest.ts`.

## Add Images

Keep images under the `images/` folder and use section folders as meaningful defaults:

```txt
images/portraits/graduation/001-grad-campus.jpg
images/portraits/studio/001-studio-color.jpg
images/events/birthday-celebration/001-cover.jpg
images/events/birthday-celebration/002-candid.jpg
```

Supported formats are `.jpg`, `.jpeg`, `.png`, `.webp`, and `.avif`.

Folder rules:

- `images/portraits/*` maps to `section: "portraits"`.
- The folder under `portraits` maps to portrait `category`.
- `images/events/*` maps to `section: "events"`.
- The folder under `events` maps to `collectionSlug`.
- Event `category` defaults to the collection folder slug.
- Numeric filename prefixes such as `001-` become the default `order`.

## Generate

Install dependencies, then generate the manifest:

```sh
npm install
npm run generate
```

CI uses:

```sh
npm ci
npm run check
npm run format:check
npm run generate:check
```

`npm run generate:check` fails when `manifests/portfolio.manifest.json` is stale. The `generatedAt` value is preserved when the image and collection content has not changed, which avoids noisy diffs.

## Manual Metadata

Human-curated fields live in `manifests/portfolio.metadata.json`.

```json
{
  "images": {
    "portraits/graduation/001-grad-campus.jpg": {
      "alt": "Graduation portrait on campus at golden hour",
      "tags": ["graduation", "campus", "outdoor"],
      "order": 1,
      "featured": true
    }
  },
  "collections": {
    "birthday-celebration": {
      "title": "Birthday Celebration",
      "description": "A celebration-focused story with details, guest reactions, and natural movement.",
      "category": "birthday",
      "tags": ["birthday", "celebration", "event"],
      "coverImagePath": "events/birthday-celebration/001-cover.jpg",
      "order": 10
    }
  }
}
```

The generator preserves metadata values and does not overwrite human curation. To append stubs for newly discovered images and event collections, run:

```sh
npm run generate -- --update-metadata
```

## Generated Fields

The generator scans `images/`, ignores non-image files, and writes:

- stable `id` values from repo-relative image paths
- `path` under the `images/` folder
- CDN `src`
- `width` and `height` from `sharp`
- `blurredImageDataUrl` for `next/image`
- `contentHash` as `sha256:<hex>`
- inferred `section`, `category`, `collectionSlug`, `collectionTitle`, and `order`

`contentHash` is used to detect changed image bytes under the same filename. When `path` and `contentHash` match the previous manifest, existing dimensions and blur placeholders are reused to avoid noisy manifest changes.

## CDN Config

Defaults can be overridden with environment variables:

```txt
GITHUB_OWNER=OODemi52
GITHUB_REPO=dlabs-photos
GITHUB_BRANCH=main
IMAGE_ROOT=images
CDN_BASE=https://cdn.statically.io/gh
```

Generated image URLs use:

```txt
https://cdn.statically.io/gh/<owner>/<repo>/<branch>/images/<path>
```

## Next.js Site Integration

Recommended first integration:

1. Copy `manifests/portfolio.manifest.json` into the marketing site as `config/portfolio-manifest.json`.
2. Update `config/portfolio.ts` to import the JSON file.
3. Read `manifest.images` and `manifest.collections`.

Later, the site can fetch this URL at build time:

```txt
https://cdn.statically.io/gh/OODemi52/dlabs-photos/main/manifests/portfolio.manifest.json
```

Copying the JSON is simpler and avoids a build-time network dependency.

## Validation

Runtime validation uses `zod` and fails for:

- duplicate image paths
- duplicate image IDs
- event images without `collectionSlug`
- collections with missing cover images
- unknown section folders
- unreadable image dimensions
- malformed generated image URLs
