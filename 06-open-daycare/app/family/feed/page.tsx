import { cookies } from "next/headers";

import { FeedScreen } from "@/components/feed-screen";
import { getPostsByChildrenIds, getTodayPosts } from "@/lib/feed-posts";
import { getLinkedChildrenIds } from "@/lib/family-feed";
import { createClient } from "@/utils/supabase/server";

/** Feed familiar — ruta `/family/feed`.
 *  Parent: publicaciones filtradas por hijos vinculados + anuncios generales.
 *  Admin: todas las publicaciones de la guardería. */
export default async function FamilyFeedPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted">No autenticado</p>
      </div>
    );
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role;
  let posts;

  if (userRole === "admin") {
    // Admin: obtener todas las publicaciones
    posts = await getTodayPosts(user.id);
  } else {
    // Parent: obtener posts filtrados por hijos vinculados
    const linkedChildrenIds = await getLinkedChildrenIds(user.id);
    posts = await getPostsByChildrenIds(user.id, linkedChildrenIds);
  }

  // Cursor del "Ver más"
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const cursor = posts.length > 0 ? posts[posts.length - 1].publishedAt : startOfToday;
  const hasOlder = false;

  return (
    <FeedScreen role="family" posts={posts} olderCursor={cursor} hasOlder={hasOlder} />
  );
}
