"use client";

import { createContext, useContext, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

export const NavigationPending = createContext(false);

export function SubmitButton({ children, disabled, ...props }: Omit<ComponentProps<"button">, "type">) {
  const { pending } = useFormStatus();
  const navigating = useContext(NavigationPending);
  const busy = pending || navigating;

  return (
    <button {...props} type="submit" disabled={disabled || busy} aria-busy={busy || undefined}>
      {children}
    </button>
  );
}
