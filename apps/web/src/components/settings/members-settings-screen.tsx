"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@eduflow/ui";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { useSession } from "@/hooks/use-session";
import {
  createCurrentOrganizationInvitation,
  listCurrentOrganizationInvitations,
  listCurrentOrganizationMembers
} from "@/lib/organizations/organization-members-service";
import type {
  CreateInvitationPayload,
  OrganizationInvitation,
  OrganizationMember
} from "@/lib/organizations/organization-members-types";

const invitationRoleOptions = [
  { label: "Admin", value: "ADMIN" },
  { label: "Instructor", value: "INSTRUCTOR" },
  { label: "Manager", value: "MANAGER" },
  { label: "Student", value: "STUDENT" }
] as const;

type InvitationFormValues = {
  email: string;
  role: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getStatusBadgeVariant(status: OrganizationInvitation["status"]) {
  if (status === "accepted") {
    return "success" as const;
  }

  if (status === "expired") {
    return "secondary" as const;
  }

  return "neutral" as const;
}

function getStatusLabel(status: OrganizationInvitation["status"]) {
  if (status === "accepted") {
    return "Aceito";
  }

  if (status === "expired") {
    return "Expirado";
  }

  return "Pendente";
}

export function MembersSettingsScreen() {
  const { organizations, activeOrganizationId } = useSession();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [createdInvitation, setCreatedInvitation] = useState<OrganizationInvitation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.id === activeOrganizationId
      ) ?? null,
    [activeOrganizationId, organizations]
  );

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<InvitationFormValues>({
    defaultValues: {
      email: "",
      role: "STUDENT"
    }
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextMembers, nextInvitations] = await Promise.all([
          listCurrentOrganizationMembers(),
          listCurrentOrganizationInvitations()
        ]);

        if (!isMounted) {
          return;
        }

        setMembers(nextMembers);
        setInvitations(nextInvitations);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar membros e convites"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function onSubmit(values: InvitationFormValues) {
    setErrorMessage(null);
    setError("root", { message: "" });

    try {
      const invitation = await createCurrentOrganizationInvitation(
        values as CreateInvitationPayload
      );

      setCreatedInvitation(invitation);
      setInvitations((current) => [invitation, ...current]);
      reset({
        email: "",
        role: values.role
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar o convite";

      setError("root", {
        message
      });
    }
  }

  async function copyInviteLink(inviteUrl: string) {
    const origin = window.location.origin;

    await navigator.clipboard.writeText(`${origin}${inviteUrl}`);
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando membros e convites da organizacao ativa."
        title="Carregando equipe"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Membros da organizacao"
        description={`Gerencie a equipe basica e gere links de convite para ${
          activeOrganization?.name ?? "a organizacao atual"
        }.`}
        actions={<Badge variant="success">MVP sem email</Badge>}
      />

      {errorMessage ? (
        <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl tracking-[-0.04em]">
              Convidar membro
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              O link fica disponivel para copiar e compartilhar manualmente neste MVP.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
              <AuthFormField error={errors.email?.message} htmlFor="invite-email" label="Email">
                <Input
                  aria-describedby={errors.email ? "invite-email-error" : undefined}
                  aria-invalid={errors.email ? "true" : "false"}
                  autoComplete="email"
                  id="invite-email"
                  placeholder="pessoa@empresa.com"
                  type="email"
                  {...register("email", {
                    required: "Informe um email",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Informe um email valido"
                    }
                  })}
                />
              </AuthFormField>

              <AuthFormField error={errors.role?.message} htmlFor="invite-role" label="Perfil">
                <Controller
                  control={control}
                  name="role"
                  rules={{ required: "Escolha um perfil" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {invitationRoleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </AuthFormField>

              {errors.root?.message ? (
                <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive" role="alert">
                  {errors.root.message}
                </p>
              ) : null}

              <Button className="w-full" loading={isSubmitting} type="submit">
                Criar convite
              </Button>
            </form>

            {createdInvitation ? (
              <div className="rounded-[1.5rem] border border-success/35 bg-success/12 p-4">
                <p className="text-sm font-semibold text-success">
                  Convite criado para {createdInvitation.email}
                </p>
                <p className="mt-2 break-all text-sm text-success">
                  {`${typeof window === "undefined" ? "" : window.location.origin}${createdInvitation.inviteUrl}`}
                </p>
                <Button
                  className="mt-4"
                  type="button"
                  variant="secondary"
                  onClick={() => copyInviteLink(createdInvitation.inviteUrl)}
                >
                  Copiar link
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl tracking-[-0.04em]">
              Membros atuais
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Lista basica da organizacao ativa para administracao do MVP.
            </p>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <EmptyState
                title="Nenhum membro encontrado"
                description="A organizacao ainda nao possui memberships para listar."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Entrou em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.user.name}</TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(member.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl tracking-[-0.04em]">
            Convites emitidos
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Convites expostos sem envio de email automatico nesta primeira versao.
          </p>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <EmptyState
              title="Nenhum convite criado"
              description="Os convites compartilhados aparecerao aqui com status e expiracao."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invitation.status)}>
                        {getStatusLabel(invitation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => copyInviteLink(invitation.inviteUrl)}
                      >
                        Copiar link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
