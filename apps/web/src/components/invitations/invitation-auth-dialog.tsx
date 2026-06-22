"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@eduflow/ui";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useSession } from "@/hooks/use-session";
import type { LoginSchema, RegisterSchema } from "@/lib/auth/auth-schemas";

type InvitationAuthDialogProps = {
  email: string;
  onAuthenticated: () => Promise<void> | void;
  open: boolean;
};

export function InvitationAuthDialog({
  email,
  onAuthenticated,
  open
}: InvitationAuthDialogProps) {
  const { login, register } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleLogin(values: LoginSchema) {
    await login(values);
    await onAuthenticated();
  }

  async function handleRegister(values: RegisterSchema) {
    await register(values);
    await onAuthenticated();
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Entre para continuar" : "Crie sua conta para aceitar o convite"}
          </DialogTitle>
          <DialogDescription>
            O convite foi emitido para <strong>{email}</strong>. Depois do acesso, voce continua nesta mesma tela.
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <LoginForm
            initialEmail={email}
            layout="plain"
            onSubmit={handleLogin}
            secondaryActionLabel="Criar conta"
            secondaryActionText="Ainda nao tem conta?"
            onSecondaryAction={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            initialEmail={email}
            layout="plain"
            onSubmit={handleRegister}
            secondaryActionLabel="Entrar"
            secondaryActionText="Ja tem acesso?"
            onSecondaryAction={() => setMode("login")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
