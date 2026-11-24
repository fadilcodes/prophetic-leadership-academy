"use client";

import { UserRound } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { getPublicImageUrl } from "@/lib/public-url";
import type { UstadzProfile } from "@/types/database";

type Profile = Pick<UstadzProfile, "id" | "name" | "title" | "photo_url" | "bio" | "expertise_tags">;

export function UstadzDirectory({ profiles }: { profiles: Profile[] }) {
  const [selected, setSelected] = useState("");
  const expertise = [...new Set(profiles.flatMap((profile) => profile.expertise_tags.filter(Boolean)))]
    .sort((a, b) => a.localeCompare(b, "id"));
  const visible = selected ? profiles.filter((profile) => profile.expertise_tags.includes(selected)) : profiles;

  return (
    <>
      <div role="group" aria-label="Filter bidang keahlian" className="mt-8 flex flex-wrap justify-center gap-2">
        {["", ...expertise].map((tag) => (
          <button
            type="button"
            key={tag}
            aria-pressed={selected === tag}
            onClick={() => setSelected(tag)}
            className="min-h-11 rounded-full border px-4 text-sm font-semibold text-primary hover:border-accent aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {tag || "Semua keahlian"}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{visible.length} profil ditampilkan</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((profile) => {
          const photo = getPublicImageUrl(profile.photo_url);
          return (
            <article key={profile.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                {photo ? (
                  <Image
                    src={photo}
                    alt={profile.name}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px"
                    unoptimized={!photo.startsWith("/")}
                    className="object-cover object-[center_39%]"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-primary/60">
                    <UserRound aria-hidden="true" className="size-20" strokeWidth={1.2} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h2 className="text-2xl leading-tight">{profile.name}</h2>
                <p className="mt-2 text-sm font-semibold text-primary">{profile.title}</p>
                <p className="mt-4 mb-5 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
                <ul aria-label="Bidang keahlian" className="mt-auto flex flex-wrap gap-2">
                  {[...new Set(profile.expertise_tags)].filter(Boolean).map((tag) => (
                    <li key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">{tag}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
