import type { Post, PostPhoto } from "@/lib/posts";

import { CommentIcon, HeartIcon, ImageIcon, MegaphoneIcon } from "./icons";

// Foto de la tarjeta: con src se muestra la imagen elegida; sin src, el
// placeholder dashed del mockup (posts semilla).
function PhotoBox({ photo }: { photo: PostPhoto }) {
  if (photo.src) {
    return (
      // Object URL de la foto elegida: no pasa por next/image (SPEC 06)
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo.src}
        alt={photo.label || "Foto de la publicación"}
        className="w-full rounded-2xl object-cover"
        style={{ height: photo.height }}
      />
    );
  }

  return (
    <a
      href="#"
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-photo-border bg-fade text-photo-icon"
      style={{ height: photo.height }}
    >
      <ImageIcon width={30} height={30} />
      <span className="text-[13.5px] leading-[1.36]">{photo.label}</span>
    </a>
  );
}

export function PostCard({ post }: { post: Post }) {
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
          <span className="block text-[12.5px] leading-[1.36] text-muted">{post.time}</span>
        </span>
        <span
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${post.badgeBg}`}
        >
          <span className={`size-2 rounded-full bg-current ${post.badgeText}`} />
          <span
            className={`text-xs font-extrabold leading-[1.36] tracking-[0.5px] ${post.badgeText}`}
          >
            {post.type}
          </span>
        </span>
      </div>

      {/* Audiencia */}
      <div className="mb-2.5 text-[12.5px] leading-[1.36] text-muted">{post.audience}</div>

      {/* Cuerpo */}
      <p className="text-[15.5px] leading-[1.55] text-body">{post.body}</p>

      {/* Fotos: 1 a ancho completo, 2 o más en grilla de 2 columnas */}
      {post.photos.length > 0 && (
        <div
          className={`mt-[14px] grid gap-3 ${post.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {post.photos.map((photo, index) => (
            <PhotoBox key={`${post.id}-${index}`} photo={photo} />
          ))}
        </div>
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