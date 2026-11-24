"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

export function PasswordField() {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="grid gap-2 text-sm font-bold text-primary">
      <label htmlFor={id}>Kata sandi</label>
      <div className="relative">
        <input id={id} name="password" type={visible ? "text" : "password"} autoComplete="current-password" required
          className="min-h-11 w-full rounded-lg border border-input px-3 pr-12 font-normal" />
        <button type="button" aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-controls={id}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-lg text-muted-foreground hover:text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
