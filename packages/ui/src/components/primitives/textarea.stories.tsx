import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";

import { Textarea } from "./textarea";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Textarea neutro para conteudo longo. Deve aparecer com label visivel e, quando houver validacao, com hint e erro associados. Teclado: aceita foco via Tab e edicao direta sem capturar atalhos de navegacao do formulario."
      }
    }
  },
  args: {
    placeholder: "Descreva a experiencia esperada para esta trilha..."
  }
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

function FieldPreview({
  children,
  error,
  errorId,
  fieldId,
  hint,
  hintId,
  label
}: {
  children: ReactNode;
  error?: string;
  errorId?: string;
  fieldId: string;
  hint?: string;
  hintId?: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-foreground" htmlFor={fieldId}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-sm text-muted-foreground" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <FieldPreview
        fieldId="storybook-textarea-default"
        hint="Prefira frases curtas e objetivas quando o bloco aparecer antes de um CTA."
        hintId="storybook-textarea-default-hint"
        label="Resumo da experiencia"
      >
        <Textarea
          aria-describedby="storybook-textarea-default-hint"
          id="storybook-textarea-default"
          placeholder="Descreva a experiencia esperada para esta trilha..."
        />
      </FieldPreview>
    </div>
  )
};

export const Filled: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <FieldPreview
        fieldId="storybook-textarea-description"
        hint="Contextualize objetivo, publico e resultado esperado."
        hintId="storybook-textarea-description-hint"
        label="Descricao da trilha"
      >
        <Textarea
          aria-describedby="storybook-textarea-description-hint"
          id="storybook-textarea-description"
          defaultValue="Esta trilha prepara novos gestores para operar rituais de acompanhamento, alinhamento e feedback continuo."
        />
      </FieldPreview>
    </div>
  )
};

export const WithError: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <FieldPreview
        errorId="storybook-textarea-goal-error"
        fieldId="storybook-textarea-goal"
        error="Adicione pelo menos um objetivo observavel para a trilha."
        label="Objetivo de aprendizagem"
      >
        <Textarea
          aria-describedby="storybook-textarea-goal-error"
          aria-invalid="true"
          id="storybook-textarea-goal"
          placeholder="Explique o que a pessoa sera capaz de fazer ao final."
        />
      </FieldPreview>
    </div>
  )
};
