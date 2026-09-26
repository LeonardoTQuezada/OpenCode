import Link from "next/link";
import {
  BellIcon,
  HomeIcon,
  LogoutIcon,
  PeopleIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from "./icons";

/** Ítem de navegación activo en el sidebar. */
export type NavKey = "feed" | "kids" | "notices" | "account";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: typeof HomeIcon;
};

const NAV_ITEMS: NavItem[] = [
  { key: "feed", label: "Feed", href: "/", icon: HomeIcon },
  { key: "kids", label: "Niños", href: "/kids", icon: PeopleIcon },
  { key: "notices", label: "Avisos", href: "/notices", icon: BellIcon },
  { key: "account", label: "Mi cuenta", href: "/my-account", icon: UserIcon },
];

type SidebarContentsProps = {
  active: NavKey;
};

/** Contenido compartido del sidebar (logo, botón, nav y tarjeta de usuario).
 *  Lo usa el aside de escritorio y el drawer móvil. */
export function SidebarContents({ active }: SidebarContentsProps) {
  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <SunIcon width={21} height={21} />
        </span>
        <span>
          <span className="block font-display text-[17px] font-semibold leading-[1.2] text-ink">
            OpenDayCare
          </span>
          <span className="mt-0.5 block text-[11.5px] leading-[1.36] text-muted">
            Sala Soles
          </span>
        </span>
      </Link>

      {/* Nueva publicación */}
      <Link
        href="/create-post"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3 text-[14.5px] font-extrabold leading-[1.36] text-white shadow-button"
      >
        <PlusIcon width={17} height={17} />
        Nueva publicación
      </Link>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] leading-[1.36] ${
              key === active
                ? "bg-coral-soft font-extrabold text-coral-strong"
                : "font-semibold text-nav"
            }`}
          >
            <Icon width={19} height={19} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Tarjeta de usuario */}
      <div className="mt-2.5 border-t border-card-border pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-avatar font-display text-base font-semibold text-white">
            C
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold leading-[1.36] text-ink">
              Caro Giménez
            </span>
            <span className="block text-xs leading-[1.36] text-muted">Maestra · Soles</span>
          </span>
          <Link
            href="/login"
            title="Cerrar sesión"
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-cream text-faint"
          >
            <LogoutIcon width={16} height={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

type SidebarProps = {
  active: NavKey;
};

/** Sidebar de escritorio (oculto por debajo de 768px). */
export function Sidebar({ active }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-card-border bg-card px-4 py-6 md:flex">
      <SidebarContents active={active} />
    </aside>
  );
}
