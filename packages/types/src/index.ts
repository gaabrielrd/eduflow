export type TenantId = string;

export type UserRole = "owner" | "admin" | "author" | "student";

export interface WorkspacePlaceholder {
  readonly name: string;
  readonly status: "placeholder";
}

export * from "./content-contract";
