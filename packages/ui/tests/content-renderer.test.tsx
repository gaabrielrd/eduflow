import "@testing-library/jest-dom/vitest";
import type { ContentDocument } from "@eduflow/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentRenderer } from "../src";

const fullDocument: ContentDocument = {
  version: 1,
  blocks: [
    {
      id: "heading-1",
      type: "heading",
      props: {
        level: 2,
        text: "Introducao"
      }
    },
    {
      id: "paragraph-1",
      type: "paragraph",
      props: {
        text: "Este modulo apresenta o fluxo principal da experiencia."
      }
    },
    {
      id: "quote-1",
      type: "quote",
      props: {
        text: "Aprender com contexto reduz retrabalho.",
        attribution: "Time de aprendizagem"
      }
    },
    {
      id: "callout-1",
      type: "callout",
      props: {
        variant: "warning",
        title: "Atencao",
        text: "Revise os pre-requisitos antes de publicar a aula."
      }
    },
    {
      id: "divider-1",
      type: "divider",
      props: {}
    },
    {
      id: "image-1",
      type: "image",
      props: {
        assetId: "media-image-1",
        alt: "Diagrama da jornada da pessoa aluna",
        caption: "Placeholder da ilustracao"
      }
    },
    {
      id: "video-1",
      type: "video",
      props: {
        title: "Demo do produto",
        caption: "Placeholder do video"
      }
    },
    {
      id: "file-1",
      type: "file",
      props: {
        assetId: "media-file-1",
        title: "Checklist de publicacao",
        caption: "Arquivo complementar"
      }
    }
  ]
};

describe("ContentRenderer", () => {
  it("renders every supported block type from a valid document", () => {
    const { container } = render(
      <ContentRenderer
        content={fullDocument}
        mediaAssetsById={{
          "media-file-1": {
            id: "media-file-1",
            mimeType: "application/pdf",
            originalName: "Checklist.pdf",
            readUrl: "https://cdn.eduflow.test/checklist.pdf",
            sizeBytes: 4096
          },
          "media-image-1": {
            id: "media-image-1",
            mimeType: "image/png",
            originalName: "Journey diagram.png",
            readUrl: "https://cdn.eduflow.test/journey.png",
            sizeBytes: 2048
          }
        }}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Introducao" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Este modulo apresenta o fluxo principal da experiencia.")
    ).toBeInTheDocument();
    expect(screen.getByText("Aprender com contexto reduz retrabalho.")).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "Warning callout" })).toBeInTheDocument();
    expect(container.querySelector("hr")).not.toBeNull();
    expect(screen.getByRole("img", { name: "Diagrama da jornada da pessoa aluna" })).toBeInTheDocument();
    expect(screen.getByText("Placeholder da ilustracao")).toBeInTheDocument();
    expect(screen.getByText("Demo do produto")).toBeInTheDocument();
    expect(screen.getByText("Checklist de publicacao")).toBeInTheDocument();
    expect(screen.getAllByText("Checklist.pdf").length).toBeGreaterThan(0);
  });

  it("renders nothing for empty block arrays", () => {
    const { container } = render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: []
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("applies the callout variant path for supported variants", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "callout-info",
              type: "callout",
              props: {
                variant: "info",
                text: "Contexto adicional"
              }
            },
            {
              id: "callout-success",
              type: "callout",
              props: {
                variant: "success",
                text: "Fluxo concluido"
              }
            }
          ]
        }}
      />
    );

    expect(screen.getByRole("note", { name: "Info callout" })).toHaveAttribute(
      "data-variant",
      "info"
    );
    expect(screen.getByRole("note", { name: "Success callout" })).toHaveAttribute(
      "data-variant",
      "success"
    );
  });

  it("renders html markup for rich text blocks while keeping legacy strings working", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "heading-rich",
              type: "heading",
              props: {
                level: 2,
                text: "<strong>Titulo rico</strong> com <em>fase</em>"
              }
            },
            {
              id: "paragraph-rich",
              type: "paragraph",
              props: {
                text: "<p>Texto com <strong>destaque</strong></p><ul><li>Item rico</li></ul>"
              }
            },
            {
              id: "quote-rich",
              type: "quote",
              props: {
                text: "<p>Citacao <em>rica</em></p>"
              }
            },
            {
              id: "callout-legacy",
              type: "callout",
              props: {
                variant: "info",
                text: "Texto legado preservado"
              }
            }
          ]
        }}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "Titulo rico com fase" })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.tagName === "P" && element.textContent === "Texto com destaque"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Item rico")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.tagName === "P" && element.textContent === "Citacao rica"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Texto legado preservado")).toBeInTheDocument();
  });

  it("renders placeholder metadata when present", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "image-1",
              type: "image",
              props: {
                alt: "Mapa visual do modulo",
                caption: "Ilustracao principal"
              }
            }
          ]
        }}
      />
    );

    expect(screen.getByText("Imagem")).toBeInTheDocument();
    expect(screen.getByText("Ilustracao principal")).toBeInTheDocument();
    expect(screen.getByText(/Alt text:/)).toBeInTheDocument();
    expect(screen.getByText(/Mapa visual do modulo/)).toBeInTheDocument();
  });

  it("renders resolved image and file assets when media lookup data is available", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "image-asset-1",
              type: "image",
              props: {
                assetId: "media-image-1",
                alt: "Fluxo ilustrado",
                caption: "Imagem resolvida"
              }
            },
            {
              id: "file-asset-1",
              type: "file",
              props: {
                assetId: "media-file-1",
                caption: "PDF complementar"
              }
            }
          ]
        }}
        mediaAssetsById={{
          "media-file-1": {
            id: "media-file-1",
            mimeType: "application/pdf",
            originalName: "Checklist.pdf",
            readUrl: "https://cdn.eduflow.test/checklist.pdf",
            sizeBytes: 4096
          },
          "media-image-1": {
            id: "media-image-1",
            mimeType: "image/png",
            originalName: "Journey diagram.png",
            readUrl: "https://cdn.eduflow.test/journey.png",
            sizeBytes: 2048
          }
        }}
      />
    );

    expect(screen.getByRole("img", { name: "Fluxo ilustrado" })).toHaveAttribute(
      "src",
      "https://cdn.eduflow.test/journey.png"
    );
    expect(screen.getAllByText("Checklist.pdf").length).toBeGreaterThan(0);
    expect(screen.getByText("Tamanho: 4 KB")).toBeInTheDocument();
  });

  it("shows a fallback when a referenced media asset cannot be resolved", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "image-missing-1",
              type: "image",
              props: {
                assetId: "missing-image",
                caption: "Referencia quebrada"
              }
            }
          ]
        }}
      />
    );

    expect(screen.getByText("Imagem indisponivel")).toBeInTheDocument();
    expect(screen.getByText("Asset: missing-image")).toBeInTheDocument();
  });

  it("shows a fallback for unsupported block types", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "embed-1",
              type: "embed",
              props: {
                url: "https://example.com"
              }
            }
          ]
        } as unknown as ContentDocument}
      />
    );

    expect(screen.getByText("Bloco nao suportado")).toBeInTheDocument();
    expect(screen.getByText("Tipo: embed")).toBeInTheDocument();
  });

  it("does not crash when malformed blocks slip through at runtime", () => {
    render(
      <ContentRenderer
        content={{
          version: 1,
          blocks: [
            {
              id: "broken-heading",
              type: "heading",
              props: {
                level: 2
              }
            },
            {
              id: "paragraph-1",
              type: "paragraph",
              props: {
                text: "Trecho valido preservado."
              }
            }
          ]
        } as unknown as ContentDocument}
      />
    );

    expect(screen.getByText("Bloco nao suportado")).toBeInTheDocument();
    expect(screen.getByText("Tipo: heading")).toBeInTheDocument();
    expect(screen.getByText("Trecho valido preservado.")).toBeInTheDocument();
  });
});
