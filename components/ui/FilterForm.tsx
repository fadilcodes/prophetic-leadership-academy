"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps, type FormEvent } from "react";

import { NavigationPending } from "./SubmitButton";

type FilterFormProps = Omit<ComponentProps<"form">, "action" | "method" | "onSubmit"> & { action: string };

export function FilterForm({ action, children, ...props }: FilterFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const url = new URL(action, window.location.origin);
    url.search = "";
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") url.searchParams.append(key, value);
    }

    startTransition(() => router.push(url.pathname + url.search));
  }

  return (
    <form {...props} action={action} method="get" onSubmit={submit}>
      <NavigationPending.Provider value={pending}>{children}</NavigationPending.Provider>
    </form>
  );
}
