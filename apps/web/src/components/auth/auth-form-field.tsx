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
      <label className="block text-sm font-semibold text-slate-900" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-sm text-slate-500" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-rose-600" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
