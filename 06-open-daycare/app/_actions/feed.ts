// Server Action de solo lectura (SPEC 13, paso 8): devuelve lotes de 10
// posts más viejos que el cursor para el "Ver más posts" del feed.

"use server";

import { cookies } from "next/headers";

import { getOlderPosts } from "@/lib/feed-posts";
import { createClient } from "@/utils/supabase/server";

const OLDER_BATCH_SIZE = 10;

/** Lote siguiente del feed. `before` es el published_at ISO del post más
 *  viejo ya cargado (o el inicio del día si aún no hay posts). Devuelve
 *  `hasMore`: false cuando el lote vino corto (quedó agotado). */
export async function loadOlderPostsAction(
  before: string,
): Promise<{ posts: Awaited<ReturnType<typeof getOlderPosts>>; hasMore: boolean }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await getOlderPosts(user?.id ?? "", before, OLDER_BATCH_SIZE);
  return { posts, hasMore: posts.length >= OLDER_BATCH_SIZE };
}
