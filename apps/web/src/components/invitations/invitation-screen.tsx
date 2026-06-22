"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@eduflow/ui";
import { InvitationAuthDialog } from "@/components/invitations/invitation-auth-dialog";
import { useSession } from "@/hooks/use-session";
import { acceptInvitation } from "@/lib/organizations/organization-members-service";
import type { PublicInvitation } from "@/lib/organizations/organization-members-types";

type InvitationScreenProps = {
  invitation: PublicInvitation | null;
  token: string;
  errorStatus?: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(value));
}

export function InvitationScreen({
  invitation,
  token,
  errorStatus
}: InvitationScreenProps) {
  const router = useRouter();
  const { isAuthenticated, refreshSession, session, logout } = useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailMatch = useMemo(() => {
    if (!session || !invitation) {
      return false;
    }

    return session.user.email.trim().toLowerCase() === invitation.email.trim().toLowerCase();
  }, [invitation, session]);

  async function handleAuthenticated() {
    await refreshSession();
    setErrorMessage(null);
  }

  async function handleAccept() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await acceptInvitation(token);
      await refreshSession();
      router.push("/app/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel aceitar o convite"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!invitation) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <Badge variant="secondary">Convite indisponivel</Badge>
              <CardTitle className="mt-4 text-3xl tracking-[-0.05em]">
                Este link nao esta mais disponivel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                {errorStatus === 404
                  ? "O token informado nao corresponde a nenhum convite ativo conhecido."
                  : "Nao foi possivel carregar os detalhes do convite agora."}
              </p>
              <Link className="font-semibold text-foreground underline-offset-4 hover:underline" href="/">
                Voltar para a home
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <>
      <InvitationAuthDialog
        email={invitation.email}
        open={!isAuthenticated && invitation.status === "pending"}
        onAuthenticated={handleAuthenticated}
      />

      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-border bg-card shadow-lg">
            <CardHeader className="space-y-4 bg-background text-foreground">
              <Badge variant={invitation.status === "pending" ? "success" : "secondary"}>
                Convite {invitation.status}
              </Badge>
              <CardTitle className="text-3xl tracking-[-0.05em]">
                Convite para entrar em {invitation.organization.name}
              </CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Este convite libera o perfil <strong>{invitation.role}</strong> para o email{" "}
                <strong>{invitation.email}</strong>.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-4 rounded-[1.5rem] border border-border bg-muted/45 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Organizacao
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {invitation.organization.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Expira em
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {formatDate(invitation.expiresAt)}
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              {invitation.status === "expired" ? (
                <p className="rounded-2xl border border-warning/35 bg-warning/12 px-4 py-3 text-sm text-warning">
                  Este convite expirou. Peça um novo link para um owner ou admin da organizacao.
                </p>
              ) : null}

              {invitation.status === "accepted" ? (
                <p className="rounded-2xl border border-success/35 bg-success/12 px-4 py-3 text-sm text-success">
                  Este convite ja foi aceito anteriormente.
                </p>
              ) : null}

              {!isAuthenticated && invitation.status === "pending" ? (
                <p className="rounded-2xl border border-primary/35 bg-primary/12 px-4 py-3 text-sm text-primary">
                  Entre ou crie sua conta para continuar sem sair desta pagina.
                </p>
              ) : null}

              {isAuthenticated && invitation.status === "pending" && !isEmailMatch ? (
                <div className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-4 text-sm text-destructive">
                  <p>
                    A sessao atual usa <strong>{session?.user.email}</strong>, mas o convite foi emitido para{" "}
                    <strong>{invitation.email}</strong>.
                  </p>
                  <Button className="mt-4" type="button" variant="secondary" onClick={() => void logout()}>
                    Trocar de conta
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!isAuthenticated || !isEmailMatch || invitation.status !== "pending"}
                  loading={isSubmitting}
                  type="button"
                  onClick={handleAccept}
                >
                  Aceitar convite
                </Button>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-5 text-sm font-medium text-foreground transition hover:bg-accent"
                  href="/"
                >
                  Voltar
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
