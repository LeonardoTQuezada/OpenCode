// Lectura del feed desde la BD (SPEC 13). Solo servidor: consume las posts
// con RLS de la sesión vía cookies. Devuelve el shape FeedPost ya mapeado
// (tipo de UI, autor, fotos con URL pública e isOwn contra el viewer).

import { cookies } from "next/headers";

import type { Kid } from "@/lib/kids";
import { ageLabelFromIso } from "@/lib/kids";
import type { Audience, DbPostType, PostType } from "@/lib/posts";
import { UI_TYPE_BY_BD, audienceLabel, postTitle } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

export type FeedPost = {
  id: string;
  type: PostType; // tipo de la UI, ya mapeado desde la BD
  title: string; // snapshot de la BD ("Mateo" / "Varios niños" / "Toda la sala")
  authorFirstName: string;
  isOwn: boolean; // author_id === viewer
  time: string; // "14:20"
  audience: string; // "Para: familia de Mateo" / "Para: toda la sala"
  body: string;
  photos: { src: string; width: number | null; height: number | null }[];
  likes: number; // siempre 0 hasta la spec de reacciones
  comments: number; // siempre 0
};

const POST_SELECT = `
  id, type, title, body, published_at, author_id, room_id,
  users(full_name),
  post_children(children(id, full_name, birth_date)),
  post_photos(url, width, height, position)
`;

type EmbeddedChild = { id: string; full_name: string; birth_date: string };

type PostRow = {
  id: string;
  type: DbPostType;
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

/** Crea el cliente server de Supabase con las cookies de la sesión actual. */
async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

type SupabaseServer = Awaited<ReturnType<typeof getClient>>;

/** PostgREST devuelve los embeds many-to-one como objeto; normaliza. */
function toOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/** Kid mínimo para los helpers de título/audiencia (solo se usa el nombre;
 *  avatares y edad no intervienen en esas cadenas). */
function kidForLabel(child: EmbeddedChild): Kid {
  return {
    slug: child.id,
    name: child.full_name,
    initial: child.full_name.trim().charAt(0).toUpperCase(),
    age: ageLabelFromIso(child.birth_date),
    room: "",
    avatarBg: "",
    avatarInk: "",
  };
}

/** La columna url guarda la ruta dentro del bucket público; una URL absoluta
 *  (ya canónica) se usa tal cual. */
function photoSrc(supabase: SupabaseServer, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("post-photos").getPublicUrl(path).data.publicUrl;
}

function toFeedPost(
  row: PostRow,
  viewerId: string,
  supabase: SupabaseServer,
): FeedPost {
  const author = toOne(row.users);
  const children = (row.post_children ?? [])
    .map((entry) => toOne(entry.children))
    .filter((child): child is EmbeddedChild => child !== null);
  const kids = children.map(kidForLabel);

  // Audiencia: sala si tiene room_id, por niños si no (convención SPEC 12).
  const audience: Audience = row.room_id
    ? { kind: "room" }
    : { kind: "kids", slugs: kids.map((kid) => kid.slug) };

  const published = new Date(row.published_at);
  const hh = String(published.getHours()).padStart(2, "0");
  const mm = String(published.getMinutes()).padStart(2, "0");

  return {
    id: row.id,
    type: UI_TYPE_BY_BD[row.type],
    // El title de la BD manda cuando existe; si no, se calcula al leer.
    title: row.title || postTitle(audience, kids),
    authorFirstName: (author?.full_name ?? "").split(" ")[0],
    isOwn: row.author_id === viewerId,
    time: `${hh}:${mm}`,
    audience: audienceLabel(audience, kids),
    body: row.body,
    photos: [...(row.post_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((photo) => ({
        src: photoSrc(supabase, photo.url),
        width: photo.width,
        height: photo.height,
      })),
    likes: 0,
    comments: 0,
  };
}

/** Posts publicados hoy (día local del servidor), orden desc. */
export async function getTodayPosts(viewerId: string): Promise<FeedPost[]> {
  const supabase = await getClient();

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .gte("published_at", start.toISOString())
    .lt("published_at", end.toISOString())
    .order("published_at", { ascending: false })
    .order("position", { referencedTable: "post_photos", ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las publicaciones: ${error.message}`);
  }

  return ((data ?? []) as PostRow[]).map((row) => toFeedPost(row, viewerId, supabase));
}

/** Lote de posts más viejos que el cursor `before` (ISO), orden desc. */
export async function getOlderPosts(
  viewerId: string,
  before: string,
  limit: number,
): Promise<FeedPost[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .lt("published_at", before)
    .order("published_at", { ascending: false })
    .order("position", { referencedTable: "post_photos", ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`No se pudieron cargar publicaciones anteriores: ${error.message}`);
  }

  return ((data ?? []) as PostRow[]).map((row) => toFeedPost(row, viewerId, supabase));
}
