import { CameraIcon } from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";
import { PostCard, type Post } from "@/components/post-card";
import { Sidebar } from "@/components/sidebar";

const POSTS: Post[] = [
  {
    id: "logro-orinal-mateo",
    badge: "LOGRO",
    badgeBg: "bg-badge-logro-bg",
    badgeText: "text-badge-logro",
    avatarBg: "bg-avatar-m-bg",
    avatarLabel: "M",
    title: "Mateo",
    time: "14:20 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "actividad-temperas",
    badge: "ACTIVIDAD",
    badgeBg: "bg-badge-actividad-bg",
    badgeText: "text-badge-actividad",
    avatarBg: "bg-avatar-m-bg",
    avatarLabel: "M",
    title: "Mateo",
    time: "09:40 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: { label: "Foto · pintando con témperas", height: 200 },
    likes: 5,
    comments: 2,
  },
  {
    id: "anuncio-parque",
    badge: "ANUNCIO",
    badgeBg: "bg-badge-anuncio-bg",
    badgeText: "text-badge-anuncio",
    avatarBg: "bg-badge-anuncio-bg",
    avatarLabel: "",
    title: "Anuncio general",
    time: "07:50 · publicado por vos",
    audience: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav />
        <main className="w-full max-w-[760px] flex-1 px-10 pb-20 pt-[34px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-coral-strong">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
              Buenas, Caro
            </h1>
            <p className="mt-[5px] text-[14.5px] leading-[1.36] text-faint">
              12 niños · martes 17 jun
            </p>
          </div>

          {/* Composer */}
          <a
            href="#"
            className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-card-border bg-card px-[18px] py-[14px] shadow-composer"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-avatar font-display text-base font-semibold text-white">
              C
            </span>
            <span className="flex-1 text-[15px] leading-[1.36] text-muted">
              Compartí un momento…
            </span>
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral">
              <CameraIcon width={19} height={19} />
            </span>
          </a>

          {/* Separador PUBLICADO HOY */}
          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-label">
              PUBLICADO HOY
            </span>
            <span className="h-px flex-1 bg-divider" />
          </div>

          {/* Posts */}
          <div className="flex flex-col gap-4">
            {POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}