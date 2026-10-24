import type { FeedPost } from "@/lib/feed-posts";
import { badgeClasses } from "@/lib/posts";

import { CommentIcon, HeartIcon, MegaphoneIcon } from "./icons";

type Role = "staff" | "family";

export function PostCard({ role, post }: { role: Role; post: FeedPost }) {
  const badge = badgeClasses(post.type);
  const showEditButton = role === "staff" && post.isOwn;

  return (
    <article className="rounded-[20px] border border-card-border bg-card px-[22px] py-5 shadow-card">
      {/* Cabecera: avatar, título, hora y badge */}
      <div className="mb-[14px] flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full font-display text-[17px] font-semibold ${post.avatarBg} ${post.avatarInk}`}
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
          <span className="block text-[12.5px] leading-[1.36] text-muted">
            {post.time} ·{" "}
            {post.isOwn ? "publicado por vos" : `publicado por ${post.authorFirstName}`}
          </span>
        </span>
        <span className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${badge.bg}`}>
          <span className={`size-2 rounded-full bg-current ${badge.text}`} />
          <span
            className={`text-xs font-extrabold leading-[1.36] tracking-[0.5px] ${badge.text}`}
          >
            {post.type}
          </span>
        </span>
      </div>

      {/* Audiencia */}
      <div className="mb-2.5 text-[12.5px] leading-[1.36] text-muted">{post.audience}</div>

      {/* Cuerpo */}
      <p className="text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {/* Fotos reales del bucket: 1 a ancho completo, 2 o más en grilla de 2 columnas */}
      {post.photos.length > 0 && (
        <div
          className={`mt-[14px] grid gap-3 ${post.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {post.photos.map((photo, index) => (
            // Object URL / URL pública del bucket: no pasa por next/image (SPEC 06)
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${post.id}-${index}`}
              src={photo.src}
              alt="Foto de la publicación"
              className="w-full rounded-2xl object-cover"
              style={{ height: photo.height ?? 200 }}
            />
          ))}
        </div>
      )}

      {/* Pie: likes, comentarios y Editar (solo en posts propios para staff, inerte) */}
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
        {showEditButton && (
          <a href="#" className="text-sm font-extrabold leading-[1.36] text-coral-deep">
            Editar
          </a>
        )}
      </div>
    </article>
  );
}
