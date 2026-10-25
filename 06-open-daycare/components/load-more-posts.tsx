"use client";

// "Ver más posts" (SPEC 13, paso 8): al hacer clic pide el lote siguiente
// vía loadOlderPostsAction, lo agrupa por día con su separador ("PUBLICADO
// AYER" / "PUBLICADO EL 17 JUN") y oculta el link cuando se agota. Si el
// lote continúa un día ya abierto, se le suman posts a esa misma sección
// (el cursor es el published_at del post más viejo cargado, así un día con
// más de 10 posts no se parte ni se saltea).

import { useState } from "react";

import type { FeedPost } from "@/lib/feed-posts";

import { loadOlderPostsAction } from "@/app/_actions/feed";
import { PostCard } from "./post-card";

type DayGroup = { key: string; label: string; posts: FeedPost[] };

/** Clave local de día (YYYY-MM-DD) para agrupar un lote. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Separador del mockup: "PUBLICADO AYER" o "PUBLICADO EL 17 JUN". */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(d.toISOString()) === dayKey(yesterday.toISOString())) {
    return "PUBLICADO AYER";
  }
  const dayMonth = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(d);
  return `PUBLICADO EL ${dayMonth}`;
}

/** Agrupa un lote desc por cambio de día. */
function groupBatch(posts: FeedPost[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const post of posts) {
    const key = dayKey(post.publishedAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.posts.push(post);
    } else {
      groups.push({ key, label: dayLabel(post.publishedAt), posts: [post] });
    }
  }
  return groups;
}

function Separator({ label }: { label: string }) {
  return (
    <div className="mb-[14px] mt-8 flex items-center gap-[14px]">
      <span className="text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-label">
        {label}
      </span>
      <span className="h-px flex-1 bg-divider" />
    </div>
  );
}

type Role = "staff" | "family";

export function LoadMorePosts({ role, cursor, hasOlder }: { role: Role; cursor: string; hasOlder: boolean }) {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [nextCursor, setNextCursor] = useState(cursor);
  const [hasMore, setHasMore] = useState(hasOlder);
  const [loading, setLoading] = useState(false);

  async function handleLoadMore() {
    setLoading(true);
    try {
      const { posts, hasMore: more } = await loadOlderPostsAction(nextCursor);
      if (posts.length > 0) {
        const fresh = groupBatch(posts);
        // Updater puro (React StrictMode lo invoca dos veces): si el lote
        // continúa el día ya abierto, se le suman posts a esa sección sin
        // repetir el separador.
        setGroups((prev) => {
          const first = fresh[0];
          const last = prev[prev.length - 1];
          if (first && last && last.key === first.key) {
            return [
              ...prev.slice(0, -1),
              { ...last, posts: [...last.posts, ...first.posts] },
              ...fresh.slice(1),
            ];
          }
          return [...prev, ...fresh];
        });
        setNextCursor(posts[posts.length - 1].publishedAt);
      }
      setHasMore(more && posts.length > 0);
    } finally {
      setLoading(false);
    }
  }

  if (!hasOlder && groups.length === 0) return null;

  return (
    <div>
      {groups.map((group) => (
        <div key={group.key}>
          <Separator label={group.label} />
          <div className="flex flex-col gap-4">
            {group.posts.map((post) => (
              <PostCard key={post.id} role={role} post={post} />
            ))}
          </div>
        </div>
      ))}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="cursor-pointer rounded-full border border-card-border bg-card px-6 py-2.5 text-[14.5px] font-semibold text-coral transition-colors hover:bg-coral-soft disabled:cursor-default disabled:text-faint"
          >
            {loading ? "Cargando…" : "Ver más posts"}
          </button>
        </div>
      ) : (
        loading && <p className="mt-8 text-center text-[15px] text-faint">Cargando…</p>
      )}
    </div>
  );
}
