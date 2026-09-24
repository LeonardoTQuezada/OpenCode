import {
  BellIcon,
  HomeIcon,
  LogoutIcon,
  PeopleIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from "./icons";

type NavItem = {
  label: string;
  icon: typeof HomeIcon;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Feed", icon: HomeIcon, active: true },
  { label: "Niños", icon: PeopleIcon },
  { label: "Avisos", icon: BellIcon },
  { label: "Mi cuenta", icon: UserIcon },
];

/** Contenido compartido del sidebar (logo, botón, nav y tarjeta de usuario).
 *  Lo usa el aside de escritorio y el drawer móvil. */
export function SidebarContents() {
  return (
    <>
      {/* Logo */}
      <a
        href="#"
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <SunIcon width={21} height={21} />
        </span>
        <span>
          <span className="block font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </span>
          <span className="mt-0.5 block text-[11.5px] text-muted">
            Sala Soles
          </span>
        </span>
      </a>

      {/* Nueva publicación */}
      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3 text-[14.5px] font-extrabold text-white shadow-button"
      >
        <PlusIcon width={17} height={17} />
        Nueva publicación
      </a>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
              active
                ? "bg-coral-soft font-extrabold text-coral-strong"
                : "font-semibold text-nav"
            }`}
          >
            <Icon width={19} height={19} />
            {label}
          </a>
        ))}
      </nav>

      {/* Tarjeta de usuario */}
      <div className="mt-2.5 border-t border-card-border pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-avatar font-display text-base font-semibold text-white">
            C
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-ink">
              Caro Giménez
            </span>
            <span className="block text-xs text-muted">Maestra · Soles</span>
          </span>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-cream text-faint"
          >
            <LogoutIcon width={16} height={16} />
          </a>
        </div>
      </div>
    </>
  );
}

/** Sidebar de escritorio (oculto por debajo de 768px). */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-card-border bg-card px-4 py-6 md:flex">
      <SidebarContents />
    </aside>
  );
}