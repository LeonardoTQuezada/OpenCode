"use client";

import { useEffect, useState } from "react";
import { MenuIcon } from "./icons";
import { SidebarContents, type NavKey } from "./sidebar";

type MobileNavProps = {
  active: NavKey | null;
};

/** Barra superior móvil con hamburguesa que abre el sidebar como drawer
 *  (reutiliza `SidebarContents`). Visible solo por debajo de 768px. */
export function MobileNav({ active }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Bloquear el scroll del fondo mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-card-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="flex size-10 items-center justify-center rounded-xl bg-cream text-ink"
          >
            <MenuIcon width={20} height={20} />
          </button>
          <span className="font-display text-[17px] font-semibold leading-[1.2] text-ink">
            OpenDayCare
          </span>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-avatar font-display text-sm font-semibold text-white">
          C
        </span>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 flex max-h-full w-[248px] flex-col overflow-y-auto border-r border-card-border bg-card px-4 py-4 shadow-card"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="mb-2 flex size-8 self-end items-center justify-center rounded-[10px] bg-cream text-base leading-none text-faint"
            >
              ✕
            </button>
            <SidebarContents active={active} />
          </div>
        </div>
      )}
    </>
  );
}