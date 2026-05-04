import { z } from "zod";

export const PortfolioSectionSchema = z.enum(["portraits", "events"]);

export type PortfolioSection = z.infer<typeof PortfolioSectionSchema>;

export const PortfolioImageSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  src: z.string().url(),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurredImageDataUrl: z.string().regex(/^data:image\/(jpeg|webp);base64,/),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  section: PortfolioSectionSchema,
  category: z.string().min(1),
  tags: z.array(z.string()),
  order: z.number().int(),
  featured: z.boolean().optional(),
  collectionSlug: z.string().min(1).optional(),
  collectionTitle: z.string().min(1).optional(),
  shotAt: z.string().min(1).optional()
});

export type PortfolioImage = z.infer<typeof PortfolioImageSchema>;

export const PortfolioCollectionSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  tags: z.array(z.string()),
  coverImageId: z.string().min(1),
  order: z.number().int(),
  shotAt: z.string().min(1).optional()
});

export type PortfolioCollection = z.infer<typeof PortfolioCollectionSchema>;

export const PortfolioManifestSchema = z.object({
  generatedAt: z.string().datetime(),
  images: z.array(PortfolioImageSchema),
  collections: z.array(PortfolioCollectionSchema)
});

export type PortfolioManifest = z.infer<typeof PortfolioManifestSchema>;

export const ImageMetadataSchema = z.object({
  alt: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  featured: z.boolean().optional(),
  collectionSlug: z.string().min(1).optional(),
  collectionTitle: z.string().min(1).optional(),
  shotAt: z.string().min(1).optional()
});

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

export const CollectionMetadataSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  coverImagePath: z.string().min(1).optional(),
  order: z.number().int().optional(),
  shotAt: z.string().min(1).optional()
});

export type CollectionMetadata = z.infer<typeof CollectionMetadataSchema>;

export const PortfolioMetadataSchema = z
  .object({
    images: z.record(z.string(), ImageMetadataSchema).optional(),
    collections: z.record(z.string(), CollectionMetadataSchema).optional()
  })
  .transform((metadata) => ({
    images: metadata.images ?? {},
    collections: metadata.collections ?? {}
  }));

export type PortfolioMetadata = z.infer<typeof PortfolioMetadataSchema>;
