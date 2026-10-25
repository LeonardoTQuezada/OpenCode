// Helpers para notices/anuncios (SPEC 03 + SPEC 10): consulta de posts
// de tipo announcement para staff y family. Solo servidor.

import { cookies } from "next/headers";

import type { FeedPost } from "@/lib/feed-posts";
import { createClient } from "@/utils/supabase/server";

const POST_SELECT = `
  id, type, title, body, published_at, author_id, room_id,
  users(full_name),
  post_children(children(id, full_name, birth_date)),
  post_photos(url, width, height, position)
`;

type EmbeddedChild = { id: string; full_name: string; birth_date: string };

type PostRow = {
  id: string;
  type: string;
  title: string | null;
  body: string;
  published_at: string;
  author_id: string;
  room_id: string | null;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
  post_children: { children: EmbeddedChild | EmbeddedChild[] | null }[];
  post_photos: {
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }[];
};

type SupabaseServer = Awaited<ReturnType<typeof getClient>>;

async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

function toOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/** Convierte un post de la BD a un shape simplificado para notices. */
function toNoticePost(row: PostRow, supabase: SupabaseServer) {
  const author = toOne(row.users);
  const published = new Date(row.published_at);
  const hh = String(published.getHours()).padStart(2, "0");
  const mm = String(published.getMinutes()).padStart(2, "0");

  let photoSrc = "";
  if (row.post_photos && row.post_photos.length > 0) {
    const photo = row.post_photos[0];
    const url = photo.url;
    if (/^https?:\/\//i.test(url)) {
      photoSrc = url;
    } else {
      photoSrc = supabase.storage.from("post-photos").getPublicUrl(url).data.publicUrl;
    }
  }

  return {
    id: row.id,
    title: row.title ?? "Anuncio",
    body: row.body,
    authorName: author?.full_name ?? "Staff",
    time: `${hh}:${mm}`,
    publishedAt: row.published_at,
    photo: photoSrc || null,
  };
}

/** Obtiene anuncios generales (type = 'announcement') para family.
 *  Excluye anuncios con room_id específico (esos son de sala). */
export async function getGeneralAnnouncements(): Promise<ReturnType<typeof toNoticePost>[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "announcement")
    .is("room_id", null)
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`No se pudieron cargar los anuncios: ${error.message}`);
  }

  return ((data ?? []) as PostRow[]).map((row) => toNoticePost(row, supabase));
}

/** Obtiene todos los anuncios para staff: generales + de sala. */
export async function getAllAnnouncements(): Promise<ReturnType<typeof toNoticePost>[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "announcement")
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`No se pudieron cargar los anuncios: ${error.message}`);
  }

  return ((data ?? []) as PostRow[]).map((row) => toNoticePost(row, supabase));
}
