"use client";

import { useState } from "react";
import type { Child, Room } from "@/app/_actions/children";
import { KidCard } from "./kid-card";
import { SearchIcon } from "./icons";

export type RoomGroup = {
  room: Room;
  children: Child[];
};

/** Buscador + encabezados de sala + grilla de niños (SPEC 10).
 *  Recibe los grupos por prop desde el server component; el buscador
 *  filtra por nombre en el cliente sobre todas las salas. */
export function KidsList({ groups }: { groups: RoomGroup[] }) {
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      children: term
        ? group.children.filter((child) => child.full_name.toLowerCase().includes(term))
        : group.children,
    }))
    .filter((group) => !term || group.children.length > 0);

  const totalVisible = filteredGroups.reduce((acc, group) => acc + group.children.length, 0);

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

      {groups.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-muted">Todavía no hay salas cargadas.</p>
      ) : totalVisible === 0 ? (
        <p className="py-10 text-center text-[15px] text-muted">Sin resultados</p>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.room.id} className="mb-[26px]">
            {/* Encabezado de sala */}
            <div className="mb-[14px] flex items-center gap-3">
              <span className="text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-ink">
                SALA {group.room.name.toUpperCase()}
              </span>
              <span className="text-[13px] leading-[1.36] text-muted">
                {group.children.length} {group.children.length === 1 ? "niño" : "niños"}
              </span>
              <span className="h-px flex-1 bg-divider" />
            </div>

            {/* Grilla */}
            {group.children.length > 0 ? (
              <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                {group.children.map((child) => (
                  <KidCard key={child.id} child={child} />
                ))}
              </div>
            ) : (
              <p className="py-4 text-[14px] text-muted">Sin niños en esta sala.</p>
            )}
          </section>
        ))
      )}
    </>
  );
}
