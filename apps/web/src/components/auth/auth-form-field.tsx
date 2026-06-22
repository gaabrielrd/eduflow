import type { ReactNode } from "react";

type AuthFormFieldProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  htmlFor: string;
  label: string;
};

export function AuthFormField({
  children,
  error,
  hint,
  htmlFor,
  label
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-card-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-sm text-muted-foreground" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-destructive" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
