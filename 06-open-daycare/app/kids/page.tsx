import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { KidsList } from "@/components/kids-list";
import { PlusIcon } from "@/components/icons";

/** Listado de niños de la sala — ruta `/kids`. */
export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="kids" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          {/* Header */}
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-coral-strong">
                GESTIÓN
              </div>
              <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
                Niños
              </h1>
            </div>
            <Link
              href="/add-child"
              className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold leading-[1.36] text-white shadow-button"
            >
              <PlusIcon width={17} height={17} />
              Agregar niño
            </Link>
          </div>

          {/* Buscador + encabezado + grilla */}
          <KidsList />
        </main>
      </div>
    </div>
  );
}
