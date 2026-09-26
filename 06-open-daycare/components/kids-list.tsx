"use client";

import { useState } from "react";
import { KIDS } from "@/lib/kids";
import { KidCard } from "./kid-card";
import { SearchIcon } from "./icons";

/** Buscador + encabezado de sala + grilla de niños.
 *  Es el único componente cliente de SPEC 02 (filtra con `useState`). */
export function KidsList() {
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const visibleKids = term
    ? KIDS.filter((kid) => kid.name.toLowerCase().includes(term))
    : KIDS;

  return (
    <>
      {/* Buscador */}
      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-card-border bg-card px-4 py-3">
        <SearchIcon width={18} height={18} className="shrink-0 text-photo-icon" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          aria-label="Buscar niño"
          className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-placeholder"
        />
      </div>

      {/* Encabezado de sala */}
      <div className="mb-[14px] flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-ink">
          SALA SOLES
        </span>
        <span className="text-[13px] leading-[1.36] text-muted">{KIDS.length} niños</span>
        <span className="h-px flex-1 bg-divider" />
      </div>

      {/* Grilla */}
      {visibleKids.length > 0 ? (
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          {visibleKids.map((kid) => (
            <KidCard key={kid.slug} kid={kid} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-[15px] text-muted">Sin resultados</p>
      )}
    </>
  );
}
