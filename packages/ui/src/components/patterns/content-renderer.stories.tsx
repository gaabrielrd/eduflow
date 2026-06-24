import type { ContentDocument } from "@eduflow/types";
import type { Meta, StoryObj } from "@storybook/react";

import { ContentRenderer } from "./content-renderer";

const mixedContent: ContentDocument = {
  version: 1,
  blocks: [
    {
      id: "heading-1",
      type: "heading",
      props: {
        level: 2,
        text: "Plano de onboarding"
      }
    },
    {
      id: "paragraph-1",
      type: "paragraph",
      props: {
        text: "Apresente a trilha inicial, alinhe expectativas e conecte objetivos de negocio com a rotina da pessoa participante."
      }
    },
    {
      id: "quote-1",
      type: "quote",
      props: {
        text: "Quem entende o contexto aprende mais rapido e decide melhor.",
        attribution: "Equipe de People Enablement"
      }
    },
    {
      id: "callout-1",
      type: "callout",
      props: {
        variant: "info",
        title: "Dica de facilitação",
        text: "Reserve os primeiros 10 minutos para mapear o repertorio inicial da turma antes de entrar no conteudo principal."
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
        alt: "Fluxo resumido de onboarding desenhado em quatro etapas",
        caption: "Espaco reservado para a ilustracao principal"
      }
    },
    {
      id: "video-1",
      type: "video",
      props: {
        title: "Mensagem de boas-vindas",
        caption: "Placeholder para o video institucional"
      }
    },
    {
      id: "file-1",
      type: "file",
      props: {
        title: "Guia da primeira semana",
        caption: "Arquivo complementar para consulta rapida"
      }
    }
  ]
};

const placeholderContent: ContentDocument = {
  version: 1,
  blocks: mixedContent.blocks.filter(
    (block) => block.type === "image" || block.type === "video" || block.type === "file"
  )
};

const unsupportedContent = {
  version: 1,
  blocks: [
    {
      id: "unknown-1",
      type: "embed",
      props: {
        url: "https://example.com"
      }
    }
  ]
} as unknown as ContentDocument;

const meta = {
  title: "Patterns/ContentRenderer",
  component: ContentRenderer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof ContentRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MixedDocument: Story = {
  args: {
    content: mixedContent,
    className: "max-w-3xl"
  }
};

export const EmptyDocument: Story = {
  args: {
    content: {
      version: 1,
      blocks: []
    }
  }
};

export const PlaceholderBlocks: Story = {
  args: {
    content: placeholderContent,
    className: "max-w-3xl"
  }
};

export const UnsupportedBlockFallback: Story = {
  args: {
    content: unsupportedContent,
    className: "max-w-3xl"
  }
};
