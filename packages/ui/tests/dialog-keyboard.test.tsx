import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from "../src";

describe("Dialog keyboard behavior", () => {
  it("returns focus to the trigger after closing with Escape", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Abrir dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Titulo</DialogTitle>
          <DialogDescription>Descricao</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: "Abrir dialog" });

    trigger.focus();
    await user.keyboard("{Enter}");

    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});
