import { z } from "zod";

export const contentDocumentVersionSchema = z.literal(1);

const blockIdSchema = z.string().min(1, "Block id is required");
const nonEmptyTextSchema = z.string().trim().min(1, "Text is required");

export const calloutVariantSchema = z.enum([
  "info",
  "success",
  "warning",
  "destructive"
]);

function createBlockSchema<
  TType extends string,
  TProps extends z.ZodRawShape
>(type: TType, propsShape: TProps) {
  return z.object({
    id: blockIdSchema,
    type: z.literal(type),
    props: z.object(propsShape).strict()
  }).strict();
}

export const headingBlockSchema = createBlockSchema("heading", {
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6)
  ]),
  text: nonEmptyTextSchema
});

export const paragraphBlockSchema = createBlockSchema("paragraph", {
  text: z.string()
});

export const quoteBlockSchema = createBlockSchema("quote", {
  attribution: z.string().optional(),
  text: z.string()
});

export const calloutBlockSchema = createBlockSchema("callout", {
  text: z.string(),
  title: z.string().optional(),
  variant: calloutVariantSchema
});

export const dividerBlockSchema = createBlockSchema("divider", {});

export const imageBlockSchema = createBlockSchema("image", {
  alt: z.string().optional(),
  caption: z.string().optional()
});

export const videoBlockSchema = createBlockSchema("video", {
  caption: z.string().optional(),
  title: z.string().optional()
});

export const fileBlockSchema = createBlockSchema("file", {
  caption: z.string().optional(),
  title: z.string().optional()
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  paragraphBlockSchema,
  quoteBlockSchema,
  calloutBlockSchema,
  dividerBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  fileBlockSchema
]);

export const contentDocumentSchema = z.object({
  version: contentDocumentVersionSchema,
  blocks: z.array(contentBlockSchema)
}).strict();

export type ContentDocumentVersion = z.infer<typeof contentDocumentVersionSchema>;
export type CalloutVariant = z.infer<typeof calloutVariantSchema>;
export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>;
export type QuoteBlock = z.infer<typeof quoteBlockSchema>;
export type CalloutBlock = z.infer<typeof calloutBlockSchema>;
export type DividerBlock = z.infer<typeof dividerBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
export type FileBlock = z.infer<typeof fileBlockSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type ContentDocument = z.infer<typeof contentDocumentSchema>;
