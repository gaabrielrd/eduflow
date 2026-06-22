import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from "../src";

describe("Field accessibility", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("associates visible labels with input and textarea fields", () => {
    render(
      <form>
        <label htmlFor="course-title">Titulo do curso</label>
        <Input id="course-title" />

        <label htmlFor="course-summary">Resumo</label>
        <Textarea id="course-summary" />
      </form>
    );

    expect(screen.getByLabelText("Titulo do curso")).toHaveAttribute("id", "course-title");
    expect(screen.getByLabelText("Resumo")).toHaveAttribute("id", "course-summary");
  });

  it("exposes the checkbox name through its label", () => {
    render(
      <label>
        <Checkbox />
        Publicar notificacoes para o time
      </label>
    );

    expect(
      screen.getByRole("checkbox", { name: "Publicar notificacoes para o time" })
    ).toBeInTheDocument();
  });

  it("supports keyboard interaction in select controls with a visible label", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <label htmlFor="membership-role">Perfil da pessoa</label>
        <Select defaultValue="member">
          <SelectTrigger id="membership-role">
            <SelectValue placeholder="Selecione um perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

    const trigger = screen.getByLabelText("Perfil da pessoa");

    trigger.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("option", { name: "Owner" })).toBeInTheDocument();

    await user.keyboard("{ArrowUp}{Enter}");

    expect(screen.getByRole("combobox", { name: "Perfil da pessoa" })).toHaveTextContent(
      "Admin"
    );
  });
});
