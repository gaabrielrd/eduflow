"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type * as React from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    className={cn("inline-flex h-11 items-center rounded-lg border border-border bg-muted p-1 text-muted-foreground", className)}
    ref={ref}
    {...props}
  />
));

TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex min-w-24 items-center justify-center rounded-md px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm",
      className
    )}
    ref={ref}
    {...props}
  />
));

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}
    ref={ref}
    {...props}
  />
));

TabsContent.displayName = TabsPrimitive.Content.displayName;
