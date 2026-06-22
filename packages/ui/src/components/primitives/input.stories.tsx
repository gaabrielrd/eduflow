import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";

import { Input } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Campo de texto neutro. Deve ser usado com label visivel; placeholder funciona apenas como ajuda complementar. Teclado: Tab move o foco, Shift+Tab retorna e leitores de tela dependem da associacao correta com `label`."
      }
    }
  },
  args: {
    placeholder: "nome@empresa.com"
  }
} satisfies Meta<typeof Input>;

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
    <div className="w-full max-w-md">
      <FieldPreview
        fieldId="storybook-input-default"
        hint="Use o texto auxiliar para orientar o preenchimento sem substituir a label."
        hintId="storybook-input-default-hint"
        label="Nome do curso"
      >
        <Input
          aria-describedby="storybook-input-default-hint"
          id="storybook-input-default"
          placeholder="Onboarding de lideranca"
        />
      </FieldPreview>
    </div>
  )
};

export const Types: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-4">
      <FieldPreview fieldId="storybook-input-type-email" label="Email">
        <Input id="storybook-input-type-email" placeholder="nome@empresa.com" type="email" />
      </FieldPreview>
      <FieldPreview fieldId="storybook-input-type-url" label="Link de referencia">
        <Input id="storybook-input-type-url" placeholder="https://eduflow.app" type="url" />
      </FieldPreview>
      <FieldPreview fieldId="storybook-input-type-search" label="Buscar cursos">
        <Input id="storybook-input-type-search" placeholder="Nome ou slug do curso" type="search" />
      </FieldPreview>
    </div>
  )
};

export const WithLabelHintAndError: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-5">
      <FieldPreview
        fieldId="storybook-input-email"
        hint="Usado para login, convites e comunicacoes do workspace."
        hintId="storybook-input-email-hint"
        label="Email de contato"
      >
        <Input
          aria-describedby="storybook-input-email-hint"
          id="storybook-input-email"
          placeholder="nome@empresa.com"
          type="email"
        />
      </FieldPreview>

      <FieldPreview
        errorId="storybook-input-billing-error"
        fieldId="storybook-input-billing"
        error="Informe um email valido para continuar."
        label="Email de faturamento"
      >
        <Input
          aria-describedby="storybook-input-billing-error"
          aria-invalid="true"
          id="storybook-input-billing"
          placeholder="financeiro@empresa.com"
          type="email"
        />
      </FieldPreview>
    </div>
  )
};

export const Disabled: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <FieldPreview
        fieldId="storybook-input-owner"
        hint="Exemplo de campo somente leitura no contexto atual."
        hintId="storybook-input-owner-hint"
        label="Responsavel"
      >
        <Input
          aria-describedby="storybook-input-owner-hint"
          disabled
          id="storybook-input-owner"
          value="owner@eduflow.app"
        />
      </FieldPreview>
    </div>
  )
};
