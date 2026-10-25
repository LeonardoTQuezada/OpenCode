import { cookies } from "next/headers";

import { FeedScreen } from "@/components/feed-screen";
import { getOlderPosts, getTodayPosts } from "@/lib/feed-posts";
import { createClient } from "@/utils/supabase/server";

export default async function StaffFeedPage() {
  // Posts reales del día (SPEC 13): se leen server-side con las cookies de la
  // sesión (RLS resuelve el aislamiento); el header real lo reparte el layout.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerId = user?.id ?? "";
  const posts = await getTodayPosts(viewerId);

  // Cursor del "Ver más": published_at del post más viejo de hoy (o el
  // inicio del día si hoy está vacío) y sonda de si existe algo anterior.
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const cursor = posts.length > 0 ? posts[posts.length - 1].publishedAt : startOfToday;
  const hasOlder = (await getOlderPosts(viewerId, cursor, 1)).length > 0;

  return <FeedScreen role="staff" posts={posts} olderCursor={cursor} hasOlder={hasOlder} />;
}
