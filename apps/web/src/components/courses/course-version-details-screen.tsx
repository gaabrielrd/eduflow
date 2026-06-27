"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  LoadingState,
  PageHeader
} from "@eduflow/ui";
import type { BadgeProps } from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { formatCourseDate } from "@/lib/courses/course-formatters";
import { getCourseVersion } from "@/lib/courses/course-service";
import type { CourseVersionDetails } from "@/lib/courses/course-types";

function getCourseVersionStatusVariant(
  status: CourseVersionDetails["status"]
): NonNullable<BadgeProps["variant"]> {
  return status === "PUBLISHED" ? "success" : "neutral";
}

function MetadataItem({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function CourseVersionDetailsScreen({
  courseId,
  versionId
}: {
  courseId: string;
  versionId: string;
}) {
  const [version, setVersion] = useState<CourseVersionDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadVersion = useCallback(async () => {
    try {
      const nextVersion = await getCourseVersion(courseId, versionId);

      setVersion(nextVersion);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os metadados da versao"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId, versionId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadVersion();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadVersion]);

  function handleRetryLoadVersion() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadVersion();
  }

  const breadcrumbItems = useMemo(
    () =>
      version
        ? [
            { href: "/app/dashboard", label: "App" },
            { href: "/app/courses", label: "Cursos" },
            {
              href: `/app/courses/${courseId}`,
              label: version.snapshotMetadata.course.title
            },
            {
              href: `/app/courses/${courseId}/versions`,
              label: "Versoes"
            },
            { label: `Versao ${version.versionNumber}` }
          ]
        : null,
    [courseId, version]
  );

  useAppBreadcrumbs(breadcrumbItems);

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando os metadados da versao publicada."
        title="Carregando metadados da versao"
      />
    );
  }

  if (errorMessage || !version) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadVersion}>Tentar novamente</Button>}
        description={
          errorMessage ?? "Nao foi possivel localizar a versao solicitada."
        }
        title="Nao foi possivel carregar a versao"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href={`/app/courses/${courseId}/versions`}>
              Voltar para versoes
            </Link>
          </Button>
        }
        description="Metadados seguros do snapshot publicado, sem conteudo das aulas ou dados internos de midia."
        eyebrow="Versao publicada"
        title={`Versao ${version.versionNumber}`}
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-card-foreground">
                {version.title}
              </h2>
              <Badge variant={getCourseVersionStatusVariant(version.status)}>
                {version.status}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {version.description ?? "Sem descricao publicada."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem
            label="Publicada em"
            value={formatCourseDate(version.publishedAt)}
          />
          <MetadataItem label="Publicada por" value={version.publishedBy.name} />
          <MetadataItem label="Status" value={version.status} />
          <MetadataItem
            label="Schema"
            value={`v${version.snapshotMetadata.schemaVersion}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-card-foreground">
            Curso no momento da publicacao
          </h2>
        </CardHeader>
        <CardContent className="grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem
            label="Titulo"
            value={version.snapshotMetadata.course.title}
          />
          <MetadataItem label="Slug" value={version.snapshotMetadata.course.slug} />
          <MetadataItem
            label="Modulos"
            value={version.snapshotMetadata.moduleCount}
          />
          <MetadataItem
            label="Aulas"
            value={version.snapshotMetadata.lessonCount}
          />
          <MetadataItem
            label="Midias"
            value={version.snapshotMetadata.mediaCount}
          />
          <MetadataItem
            label="Descricao"
            value={
              version.snapshotMetadata.course.description ??
              "Sem descricao publicada."
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}
