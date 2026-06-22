import { forwardRef, type HTMLAttributes, type TableHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm text-muted-foreground", className)}
        ref={ref}
        {...props}
      />
    </div>
  )
);

Table.displayName = "Table";

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} ref={ref} {...props} />
));

TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    className={cn("[&_tr:last-child]:border-0 [&_tr]:border-b [&_tr]:border-border/70", className)}
    ref={ref}
    {...props}
  />
));

TableBody.displayName = "TableBody";

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot className={cn("border-t border-border bg-muted/30 font-medium text-foreground", className)} ref={ref} {...props} />
));

TableFooter.displayName = "TableFooter";

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr className={cn("transition-colors hover:bg-accent/70", className)} ref={ref} {...props} />
));

TableRow.displayName = "TableRow";

export const TableHead = forwardRef<
  HTMLTableHeaderCellElement,
  HTMLAttributes<HTMLTableHeaderCellElement>
>(({ className, ...props }, ref) => (
  <th
    className={cn(
      "h-12 px-4 text-left text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground align-middle",
      className
    )}
    ref={ref}
    {...props}
  />
));

TableHead.displayName = "TableHead";

export const TableCell = forwardRef<
  HTMLTableDataCellElement,
  HTMLAttributes<HTMLTableDataCellElement>
>(({ className, ...props }, ref) => (
  <td className={cn("px-4 py-4 align-middle", className)} ref={ref} {...props} />
));

TableCell.displayName = "TableCell";

export function TableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <caption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}
