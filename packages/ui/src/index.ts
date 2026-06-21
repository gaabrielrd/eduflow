export interface UiPrimitiveDefinition {
  readonly name: string;
  readonly category: "layout" | "feedback" | "form";
}

export const uiPrimitives: UiPrimitiveDefinition[] = [
  {
    name: "Button",
    category: "form"
  }
];
