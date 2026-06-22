import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2, "Informe um identificador")
  .max(120, "Use no maximo 120 caracteres")
  .refine((value) => /[a-z0-9]/i.test(value), {
    message: "Use pelo menos uma letra ou numero no identificador"
  });

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, "Use no maximo 5000 caracteres")
  .transform((value) => value);

export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o nome do curso")
    .max(120, "Use no maximo 120 caracteres"),
  slug: slugSchema,
  description: descriptionSchema
});

export const updateCourseSchema = createCourseSchema;

export type CreateCourseSchema = z.infer<typeof createCourseSchema>;
export type UpdateCourseSchema = z.infer<typeof updateCourseSchema>;
