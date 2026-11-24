"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetTitle = SheetPrimitive.Title;

export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-40 bg-primary/50 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:fade-out motion-safe:data-[state=open]:fade-in" />
      <SheetPrimitive.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(22rem,90vw)] flex-col overflow-y-auto border-l bg-background p-6 shadow-xl duration-300 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:slide-out-to-right motion-safe:data-[state=open]:slide-in-from-right",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 grid size-11 place-items-center rounded-md text-primary hover:bg-accent/10">
          <X aria-hidden="true" className="size-5" />
          <span className="sr-only">Tutup menu</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
