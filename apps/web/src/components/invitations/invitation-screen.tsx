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
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <Badge variant="secondary">Convite indisponivel</Badge>
              <CardTitle className="mt-4 text-3xl tracking-[-0.05em]">
                Este link nao esta mais disponivel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <p>
                {errorStatus === 404
                  ? "O token informado nao corresponde a nenhum convite ativo conhecido."
                  : "Nao foi possivel carregar os detalhes do convite agora."}
              </p>
              <Link className="font-semibold text-slate-950 underline-offset-4 hover:underline" href="/">
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

      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-white/70 bg-white/92 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <CardHeader className="space-y-4 bg-slate-950 text-white">
              <Badge variant={invitation.status === "pending" ? "success" : "secondary"}>
                Convite {invitation.status}
              </Badge>
              <CardTitle className="text-3xl tracking-[-0.05em]">
                Convite para entrar em {invitation.organization.name}
              </CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Este convite libera o perfil <strong>{invitation.role}</strong> para o email{" "}
                <strong>{invitation.email}</strong>.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Organizacao
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {invitation.organization.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Expira em
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {formatDate(invitation.expiresAt)}
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              {invitation.status === "expired" ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Este convite expirou. Peça um novo link para um owner ou admin da organizacao.
                </p>
              ) : null}

              {invitation.status === "accepted" ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Este convite ja foi aceito anteriormente.
                </p>
              ) : null}

              {!isAuthenticated && invitation.status === "pending" ? (
                <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Entre ou crie sua conta para continuar sem sair desta pagina.
                </p>
              ) : null}

              {isAuthenticated && invitation.status === "pending" && !isEmailMatch ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
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
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
