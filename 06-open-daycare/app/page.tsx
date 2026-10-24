import { cookies } from "next/headers";

import { FeedScreen } from "@/components/feed-screen";
import { getTodayPosts } from "@/lib/feed-posts";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  // Posts reales del día (SPEC 13): se leen server-side con las cookies de la
  // sesión (RLS resuelve el aislamiento); el header real lo reparte el layout.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await getTodayPosts(user?.id ?? "");

  return <FeedScreen posts={posts} />;
}
