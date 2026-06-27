export type TenantId = string;

export type UserRole = "owner" | "admin" | "author" | "student";

export interface WorkspacePlaceholder {
  readonly name: string;
  readonly status: "placeholder";
}

export * from "./content-contract.js";
export * from "./course-publish-validation.js";
export * from "./course-version-snapshot.js";
