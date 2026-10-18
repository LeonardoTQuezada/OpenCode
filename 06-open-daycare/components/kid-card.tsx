import Link from "next/link";
import type { Child } from "@/app/_actions/children";
import { ageLabelFromIso } from "@/lib/kids";
import { Avatar } from "./avatar";
import { ChevronRightIcon } from "./icons";

/** Paletas de avatar en rotación (las mismas del mock). */
const AVATAR_PALETTES: { bg: string; ink: string }[] = [
  { bg: "bg-kid-blue", ink: "text-kid-blue-ink" },
  { bg: "bg-kid-pink", ink: "text-kid-pink-ink" },
  { bg: "bg-kid-green", ink: "text-kid-green-ink" },
  { bg: "bg-kid-yellow", ink: "text-kid-yellow-ink" },
  { bg: "bg-kid-purple", ink: "text-kid-purple-ink" },
];

/** Paleta estable por niño: el mismo id siempre eligiendo la misma. */
function paletteFor(id: string) {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

/** Tarjeta de un niño en el listado `/kids`. Todo el card enlaza al perfil. */
export function KidCard({ child }: { child: Child }) {
  const palette = paletteFor(child.id);
  const age = ageLabelFromIso(child.birth_date);
  const firstAllergy = child.allergy_tags[0]?.trim();

  return (
    <Link
      href={`/kids/${child.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-card-border bg-card p-4 shadow-kid transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <Avatar
        label={child.full_name.charAt(0).toUpperCase()}
        size={48}
        bg={palette.bg}
        ink={palette.ink}
      />

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-semibold leading-[1.3] text-ink">
          {child.full_name}
        </span>
        {age && <span className="block text-[13px] leading-[1.36] text-muted">{age}</span>}
      </span>

      {firstAllergy ? (
        <span className="shrink-0 rounded-full bg-tag-allergy-bg px-[9px] py-[5px] text-[11px] font-extrabold leading-[1.36] text-tag-allergy">
          {firstAllergy.toUpperCase()}
        </span>
      ) : (
        <ChevronRightIcon width={18} height={18} className="shrink-0 text-chevron" />
      )}
    </Link>
  );
}
