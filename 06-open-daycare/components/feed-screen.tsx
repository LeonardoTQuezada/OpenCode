"use client";

// Pantalla del feed (SPEC 06 + SPEC 13): header con el perfil real de la
// sesión, composer que abre el modal "Nueva publicación" y la lista de posts
// del día que el server trae desde Supabase (props `posts`).

import type { FeedPost } from "@/lib/feed-posts";

import { CameraIcon } from "./icons";
import { LoadMorePosts } from "./load-more-posts";
import { MobileNav } from "./mobile-nav";
import { PostCard } from "./post-card";
import { usePosts } from "./posts-provider";
import { Sidebar } from "./sidebar";
import { useUserProfile } from "./user-profile-provider";

// Fecha de hoy en el mismo formato del mockup: "martes 17 jun".
function todayLabel(): string {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(now);
  const dayMonth = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(now);
  return `${weekday} ${dayMonth}`;
}

export function FeedScreen({
  posts,
  olderCursor,
  hasOlder,
}: {
  posts: FeedPost[];
  olderCursor: string;
  hasOlder: boolean;
}) {
  const { openComposer, kids } = usePosts();
  const profile = useUserProfile();

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="feed" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="feed" />
        <main className="mx-auto w-full max-w-[760px] flex-1 px-10 pb-20 pt-[34px]">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-coral-strong">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
              Buenas, {profile?.fullName.split(" ")[0] ?? "-"}
            </h1>
            <p className="mt-[5px] text-[14.5px] leading-[1.36] text-faint">
              {kids.length} niños · {todayLabel()}
            </p>
          </div>

          {/* Composer: abre el modal en lugar de navegar (SPEC 06) */}
          <button
            type="button"
            onClick={openComposer}
            className="mb-6 flex w-full cursor-pointer items-center gap-[14px] rounded-[18px] border border-card-border bg-card px-[18px] py-[14px] text-left shadow-composer"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-avatar font-display text-base font-semibold text-white">
              {profile?.initials ?? "?"}
            </span>
            <span className="flex-1 text-[15px] leading-[1.36] text-muted">
              Compartí un momento…
            </span>
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral">
              <CameraIcon width={19} height={19} />
            </span>
          </button>

          {/* Separador PUBLICADO HOY */}
          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-label">
              PUBLICADO HOY
            </span>
            <span className="h-px flex-1 bg-divider" />
          </div>

          {/* Posts reales del día; estado vacío si aún no hay ninguno */}
          {posts.length === 0 ? (
            <p className="text-[15px] leading-[1.55] text-faint">
              Todavía no hay publicaciones. Compartí el primer momento del día.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Lotes anteriores bajo su separador de día (SPEC 13, paso 8) */}
          <LoadMorePosts cursor={olderCursor} hasOlder={hasOlder} />
        </main>
      </div>
    </div>
  );
}
