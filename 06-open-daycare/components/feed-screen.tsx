"use client";

// Pantalla del feed (SPEC 06): header, composer que abre el modal "Nueva
// publicación" y la lista de posts que vive en PostsProvider.

import { CameraIcon } from "./icons";
import { MobileNav } from "./mobile-nav";
import { PostCard } from "./post-card";
import { usePosts } from "./posts-provider";
import { Sidebar } from "./sidebar";

export function FeedScreen() {
  const { posts, openComposer } = usePosts();

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
              Buenas, Caro
            </h1>
            <p className="mt-[5px] text-[14.5px] leading-[1.36] text-faint">
              12 niños · martes 17 jun
            </p>
          </div>

          {/* Composer: abre el modal en lugar de navegar (SPEC 06) */}
          <button
            type="button"
            onClick={openComposer}
            className="mb-6 flex w-full cursor-pointer items-center gap-[14px] rounded-[18px] border border-card-border bg-card px-[18px] py-[14px] text-left shadow-composer"
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
          </button>

          {/* Separador PUBLICADO HOY */}
          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-label">
              PUBLICADO HOY
            </span>
            <span className="h-px flex-1 bg-divider" />
          </div>

          {/* Posts */}
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
