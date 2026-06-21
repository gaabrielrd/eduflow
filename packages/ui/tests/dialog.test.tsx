import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from "../src";

describe("Dialog", () => {
  it("opens, moves focus to the dialog content and closes", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Abrir dialog" }));

    const title = await screen.findByText("Titulo");
    expect(title).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");

    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Titulo")).not.toBeInTheDocument();
    });
  });
});
