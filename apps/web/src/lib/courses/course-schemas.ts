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

export const moduleTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o titulo do modulo")
    .max(120, "Use no maximo 120 caracteres")
});

export const lessonTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o titulo da aula")
    .max(120, "Use no maximo 120 caracteres")
});

export type CreateCourseSchema = z.infer<typeof createCourseSchema>;
export type UpdateCourseSchema = z.infer<typeof updateCourseSchema>;
export type ModuleTitleSchema = z.infer<typeof moduleTitleSchema>;
export type LessonTitleSchema = z.infer<typeof lessonTitleSchema>;
