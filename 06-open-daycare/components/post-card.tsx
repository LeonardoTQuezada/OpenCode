import { CommentIcon, HeartIcon, ImageIcon, MegaphoneIcon } from "./icons";

export type Badge = "LOGRO" | "ACTIVIDAD" | "ANUNCIO";

export type Post = {
  id: string;
  badge: Badge;
  /** Clases Tailwind del pill: `bg-*` derivada del token @theme. */
  badgeBg: string;
  /** Clase Tailwind `text-*` derivada del token @theme. */
  badgeText: string;
  /** Clase Tailwind `bg-*` del avatar. */
  avatarBg: string;
  /** Letra para el avatar del niño, o vacío para el ícono de anuncio. */
  avatarLabel: string;
  title: string; // "Mateo" / "Anuncio general"
  time: string; // "14:20 · publicado por vos"
  audience: string; // "Para: familia de Mateo"
  body: string;
  photo?: { label: string; height: number };
  likes: number;
  comments: number;
};

/** Color del texto del avatar según el tipo de post (mockup). */
function avatarTextClass(badge: Badge) {
  return badge === "ANUNCIO" ? "text-badge-anuncio" : "text-avatar-m";
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-[20px] border border-card-border bg-card px-[22px] py-5 shadow-card">
      {/* Cabecera: avatar, título, hora y badge */}
      <div className="mb-[14px] flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full font-display text-[17px] font-semibold ${post.avatarBg} ${avatarTextClass(post.badge)}`}
        >
          {post.avatarLabel ? (
            post.avatarLabel
          ) : (
            <MegaphoneIcon width={20} height={20} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16.5px] font-semibold leading-[1.2] text-ink">
            {post.title}
          </span>
          <span className="block text-[12.5px] leading-[1.36] text-muted">{post.time}</span>
        </span>
        <span
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${post.badgeBg}`}
        >
          <span className={`size-2 rounded-full bg-current ${post.badgeText}`} />
          <span
            className={`text-xs font-extrabold leading-[1.36] tracking-[0.5px] ${post.badgeText}`}
          >
            {post.badge}
          </span>
        </span>
      </div>

      {/* Audiencia */}
      <div className="mb-2.5 text-[12.5px] leading-[1.36] text-muted">{post.audience}</div>

      {/* Cuerpo */}
      <p className="text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {/* Foto opcional (placeholder) */}
      {post.photo && (
        <a
          href="#"
          className="mt-[14px] flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-photo-border bg-fade text-photo-icon"
          style={{ height: post.photo.height }}
        >
          <ImageIcon width={30} height={30} />
          <span className="text-[13.5px] leading-[1.36]">{post.photo.label}</span>
        </a>
      )}

      {/* Pie: likes, comentarios y Editar */}
      <div className="mt-4 flex items-center gap-[18px] border-t border-card-divider pt-[14px]">
        <span className="flex items-center gap-[7px] text-sm font-bold leading-[1.36] text-coral">
          <HeartIcon width={19} height={19} />
          {post.likes}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-sm font-bold leading-[1.36] text-faint"
        >
          <CommentIcon width={18} height={18} />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-sm font-extrabold leading-[1.36] text-coral-deep">
          Editar
        </a>
      </div>
    </article>
  );
}