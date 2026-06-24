import {
  contentBlockSchema,
  type CalloutBlock,
  type CalloutVariant,
  type ContentBlock,
  type ContentDocument,
  type FileBlock,
  type HeadingBlock,
  type ImageBlock,
  type ParagraphBlock,
  type QuoteBlock,
  type VideoBlock
} from "@eduflow/types";
import { type HTMLAttributes, type ReactNode, createElement } from "react";

import { cn } from "../../lib/cn";
import { Badge } from "../primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../primitives/card";

export interface ContentRendererProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  readonly content: ContentDocument;
}

type PlaceholderBlock = ImageBlock | VideoBlock | FileBlock;

const calloutVariantStyles: Record<CalloutVariant, string> = {
  info: "border-primary/35 bg-primary/10 text-foreground",
  success: "border-success/35 bg-success/10 text-foreground",
  warning: "border-warning/35 bg-warning/10 text-foreground",
  destructive: "border-destructive/35 bg-destructive/10 text-foreground"
};

const calloutBadgeVariant: Record<
  CalloutVariant,
  "secondary" | "success" | "warning" | "destructive"
> = {
  info: "secondary",
  success: "success",
  warning: "warning",
  destructive: "destructive"
};

const headingLevelClasses: Record<HeadingBlock["props"]["level"], string> = {
  1: "text-4xl font-semibold tracking-tight text-foreground",
  2: "text-3xl font-semibold tracking-tight text-foreground",
  3: "text-2xl font-semibold tracking-tight text-foreground",
  4: "text-xl font-semibold tracking-tight text-foreground",
  5: "text-lg font-semibold tracking-tight text-foreground",
  6: "text-base font-semibold uppercase tracking-eyebrow text-muted-foreground"
};

export function ContentRenderer({
  className,
  content,
  ...props
}: ContentRendererProps) {
  const rawBlocks = getRawBlocks(content);

  if (rawBlocks === null) {
    return (
      <div className={cn("space-y-6", className)} {...props}>
        <UnsupportedBlockFallback />
      </div>
    );
  }

  if (rawBlocks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {rawBlocks.map((rawBlock, index) => {
        const parsedBlock = contentBlockSchema.safeParse(rawBlock);
        const key = getBlockKey(rawBlock, index);

        if (!parsedBlock.success) {
          return <UnsupportedBlockFallback block={rawBlock} key={key} />;
        }

        return <RenderedBlock block={parsedBlock.data} key={key} />;
      })}
    </div>
  );
}

function getRawBlocks(content: ContentDocument): unknown[] | null {
  if (!content || typeof content !== "object") {
    return null;
  }

  const maybeBlocks = (content as { blocks?: unknown }).blocks;

  return Array.isArray(maybeBlocks) ? maybeBlocks : null;
}

function getBlockKey(block: unknown, index: number) {
  if (block && typeof block === "object" && "id" in block && typeof block.id === "string") {
    return block.id;
  }

  return `content-block-${index}`;
}

function RenderedBlock({ block }: { readonly block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return <HeadingBlockView block={block} />;
    case "paragraph":
      return <ParagraphBlockView block={block} />;
    case "quote":
      return <QuoteBlockView block={block} />;
    case "callout":
      return <CalloutBlockView block={block} />;
    case "divider":
      return <DividerBlockView />;
    case "image":
      return <PlaceholderBlockView block={block} label="Imagem" icon={<ImageIcon />} />;
    case "video":
      return <PlaceholderBlockView block={block} label="Video" icon={<VideoIcon />} />;
    case "file":
      return <PlaceholderBlockView block={block} label="Arquivo" icon={<FileIcon />} />;
    default:
      return <UnsupportedBlockFallback block={block} />;
  }
}

function HeadingBlockView({ block }: { readonly block: HeadingBlock }) {
  const tagName = `h${block.props.level}` as const;

  return createElement(tagName, {
    className: headingLevelClasses[block.props.level]
  }, block.props.text);
}

function ParagraphBlockView({ block }: { readonly block: ParagraphBlock }) {
  return <p className="text-base leading-7 text-foreground">{block.props.text}</p>;
}

function QuoteBlockView({ block }: { readonly block: QuoteBlock }) {
  return (
    <figure className="rounded-xl border-l-4 border-primary bg-muted/35 px-5 py-4 text-foreground">
      <blockquote className="text-base italic leading-7">{block.props.text}</blockquote>
      {block.props.attribution ? (
        <figcaption className="mt-3 text-sm font-medium text-muted-foreground">
          {block.props.attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}

function CalloutBlockView({ block }: { readonly block: CalloutBlock }) {
  return (
    <section
      aria-label={`${capitalize(block.props.variant)} callout`}
      className={cn(
        "rounded-xl border p-5 shadow-sm",
        calloutVariantStyles[block.props.variant]
      )}
      data-variant={block.props.variant}
      role="note"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={calloutBadgeVariant[block.props.variant]}>
          {capitalize(block.props.variant)}
        </Badge>
        {block.props.title ? (
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {block.props.title}
          </h3>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground">{block.props.text}</p>
    </section>
  );
}

function DividerBlockView() {
  return <hr aria-hidden="true" className="border-0 border-t border-border/80" />;
}

function PlaceholderBlockView({
  block,
  icon,
  label
}: {
  readonly block: PlaceholderBlock;
  readonly icon: ReactNode;
  readonly label: string;
}) {
  const title = "title" in block.props ? block.props.title : undefined;
  const caption = block.props.caption;
  const alt = "alt" in block.props ? block.props.alt : undefined;

  return (
    <Card className="border-dashed bg-card/80 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {icon}
            </div>
            <div className="space-y-2">
              <Badge variant="outline">{label}</Badge>
              <CardTitle>{title ?? `${label} indisponivel no preview`}</CardTitle>
            </div>
          </div>
        </div>
        {caption ? <CardDescription>{caption}</CardDescription> : null}
      </CardHeader>
      {alt ? (
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Alt text:</span> {alt}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function UnsupportedBlockFallback({ block }: { readonly block?: unknown }) {
  const type =
    block &&
    typeof block === "object" &&
    "type" in block &&
    typeof block.type === "string"
      ? block.type
      : "unknown";

  return (
    <div className="rounded-xl border border-dashed border-warning/45 bg-warning/10 px-4 py-3">
      <p className="text-sm font-semibold text-foreground">Bloco nao suportado</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Este trecho nao pode ser exibido no momento.
      </p>
      <p className="mt-2 text-xs font-medium uppercase tracking-eyebrow text-warning">
        Tipo: {type}
      </p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V17.5C20 18.3284 19.3284 19 18.5 19H5.5C4.67157 19 4 18.3284 4 17.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M7 15L10 12L13 15L15.5 12.5L17 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle cx="9" cy="9" fill="currentColor" r="1.25" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        width="14"
        x="4"
        y="6"
      />
      <path
        d="M18 10L21 8.5V15.5L18 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path d="M10 10L13 12L10 14V10Z" fill="currentColor" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 4.75H14.5L18.25 8.5V18.25C18.25 19.2165 17.4665 20 16.5 20H8C7.0335 20 6.25 19.2165 6.25 18.25V6.5C6.25 5.5335 7.0335 4.75 8 4.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M14 4.75V8.5H17.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M9.5 12H15M9.5 15H13.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
