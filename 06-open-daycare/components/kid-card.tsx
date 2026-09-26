import Link from "next/link";
import type { Kid } from "@/lib/kids";
import { Avatar } from "./avatar";
import { ChevronRightIcon } from "./icons";

/** Estilo del badge según su tipo (alergia vs. "VINCULAR"). */
const TAG_STYLES: Record<NonNullable<Kid["tag"]>["kind"], string> = {
  allergy: "bg-tag-allergy-bg text-tag-allergy",
  link: "bg-tag-link-bg text-tag-link",
};

/** Tarjeta de un niño en el listado `/kids`. Todo el card enlaza al perfil. */
export function KidCard({ kid }: { kid: Kid }) {
  return (
    <Link
      href="/kids/mateo"
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-card-border bg-card p-4 shadow-kid transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <Avatar label={kid.initial} size={48} bg={kid.avatarBg} ink={kid.avatarInk} />

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-semibold leading-[1.3] text-ink">
          {kid.name}
        </span>
        <span className="block text-[13px] leading-[1.36] text-muted">
          {kid.age} · {kid.parentLabel}
        </span>
      </span>

      {kid.tag ? (
        <span
          className={`shrink-0 rounded-full px-[9px] py-[5px] text-[11px] font-extrabold leading-[1.36] ${TAG_STYLES[kid.tag.kind]}`}
        >
          {kid.tag.label}
        </span>
      ) : (
        <ChevronRightIcon width={18} height={18} className="shrink-0 text-chevron" />
      )}
    </Link>
  );
}
