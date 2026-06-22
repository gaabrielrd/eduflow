import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email valido"),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
});

export const registerSchema = loginSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
});

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da organizacao")
    .max(120, "Use no maximo 120 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "Informe um identificador")
    .max(120, "Use no maximo 120 caracteres")
    .refine((value) => /[a-z0-9]/i.test(value), {
      message: "Use pelo menos uma letra ou numero no identificador"
    })
});

export const createInvitationSchema = z.object({
  email: z.string().email("Informe um email valido"),
  role: z.enum(["ADMIN", "INSTRUCTOR", "MANAGER", "STUDENT"])
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;
export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;
