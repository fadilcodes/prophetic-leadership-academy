"use client";

import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteAction({ id, action }: { id: string; action: (form: FormData) => void | Promise<void> }) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Hapus data ini?")) event.preventDefault();
  }}>
    <input type="hidden" name="id" value={id} />
    <SubmitButton className="min-h-11 rounded-lg px-2 text-sm font-semibold text-destructive enabled:hover:underline">Hapus</SubmitButton>
  </form>;
}
