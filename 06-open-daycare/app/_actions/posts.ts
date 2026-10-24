// Server Action de publicaciones (SPEC 13): valida el formulario del modal,
// sube las fotos al bucket `post-photos` y crea el post con la RPC
// `create_post` (migración 011), que inserta posts + post_children +
// post_photos en una sola transacción. Si la subida o la RPC fallan, los
// archivos ya subidos se borran del bucket (best-effort) y se devuelve el
// mensaje genérico: nunca queda un post visible sin sus fotos.

"use server";

import { cookies } from "next/headers";

import type { Child } from "@/app/_actions/children";
import { childToKidChip } from "@/lib/feed-kids";
import type { Kid } from "@/lib/kids";
import type { Audience, PostType } from "@/lib/posts";
import {
  BD_TYPE_BY_UI,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  PHOTO_MIME_TYPES,
  postTitle,
} from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

export type CreatePostResult = { ok: true } | { ok: false; message: string };

/** Mensaje único para fallos inesperados de Storage o BD (SPEC 13). */
const GENERIC_ERROR = "No se pudo publicar. Intentá de nuevo.";

/** Extensión canónica del archivo en el bucket, por MIME. */
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CHILD_COLUMNS =
  "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at";

/** Crea el cliente server de Supabase con las cookies de la sesión actual. */
async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

type SupabaseServer = Awaited<ReturnType<typeof getClient>>;

/** Borra archivos ya subidos cuando algo falló después (best-effort):
 *  si el delete falla se loguea y se ignora; el mensaje de error al usuario
 *  es el mismo igual (SPEC 13). */
async function removeUploadedPhotos(
  supabase: SupabaseServer,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from("post-photos").remove(paths);
  if (error) {
    console.error("createPostAction: no se pudieron borrar las fotos subidas", error);
  }
}

/** Crea un post real: PARA + TIPO + DESCRIPCIÓN + fotos. */
export async function createPostAction(formData: FormData): Promise<CreatePostResult> {
  const supabase = await getClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: GENERIC_ERROR };

  // --- Bloque PARA ---------------------------------------------------------
  const rawAudience = formData.get("audience");
  const childIds = formData
    .getAll("childIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const audience: Audience | null =
    rawAudience === "room"
      ? { kind: "room" }
      : rawAudience === "kids"
        ? { kind: "kids", slugs: childIds }
        : null;

  if (!audience || (audience.kind === "kids" && audience.slugs.length === 0)) {
    return { ok: false, message: "Elegí al menos un destinatario." };
  }

  // --- Bloque TIPO ---------------------------------------------------------
  const rawType = formData.get("type");
  const type =
    typeof rawType === "string" && Object.hasOwn(BD_TYPE_BY_UI, rawType)
      ? (rawType as PostType)
      : null;
  if (!type) return { ok: false, message: "Elegí un tipo de publicación." };

  // --- Bloque DESCRIPCIÓN --------------------------------------------------
  const rawBody = formData.get("body");
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!body) return { ok: false, message: "Escribí qué querés contar." };

  // --- Límites de fotos (cantidad, peso y formato) -------------------------
  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photos.length > MAX_PHOTOS) {
    return { ok: false, message: "Subí hasta 10 fotos." };
  }
  if (photos.some((file) => file.size > MAX_PHOTO_BYTES)) {
    return { ok: false, message: "Cada foto puede pesar hasta 5 MB." };
  }
  if (photos.some((file) => !PHOTO_MIME_TYPES.has(file.type))) {
    return { ok: false, message: "Usá archivos JPG, PNG o WEBP." };
  }

  // --- Datos de la sesión: guardería (path de Storage) y sala del staff ----
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("daycare_id, room_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.daycare_id) {
    console.error("createPostAction: no se pudo leer el perfil del usuario", profileError);
    return { ok: false, message: GENERIC_ERROR };
  }

  // "Toda la sala" se resuelve contra la sala asignada al staff (SPEC 13).
  let roomId: string | null = null;
  if (audience.kind === "room") {
    if (!profile.room_id) {
      return { ok: false, message: "No tenés una sala asignada. Hablá con el administrador." };
    }
    roomId = profile.room_id;
  }

  // --- Snapshot del título: nombres de los niños etiquetados ---------------
  let kids: Kid[] = [];
  if (audience.kind === "kids") {
    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select(CHILD_COLUMNS)
      .in("id", audience.slugs);

    if (childrenError) {
      console.error("createPostAction: no se pudieron leer los niños etiquetados", childrenError);
      return { ok: false, message: GENERIC_ERROR };
    }

    // Ids que no vuelven = no visibles para esta sesión (o inválidos).
    const visibleIds = new Set(((children ?? []) as Child[]).map((child) => child.id));
    if (audience.slugs.some((slug) => !visibleIds.has(slug))) {
      return { ok: false, message: GENERIC_ERROR };
    }
    kids = ((children ?? []) as Child[]).map(childToKidChip);
  }
  const title = postTitle(audience, kids);

  // --- Subida de fotos (primero; si algo falla después se limpian) --------
  const uploadedPaths: string[] = [];

  for (const file of photos) {
    const extension = PHOTO_EXTENSIONS[file.type];
    const path = `${profile.daycare_id}/${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("post-photos")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error("createPostAction: falló la subida de una foto", error);
      await removeUploadedPhotos(supabase, uploadedPaths);
      return { ok: false, message: GENERIC_ERROR };
    }
    uploadedPaths.push(path);
  }

  // --- Insert transaccional: posts + post_children + post_photos (RPC) -----
  const { data: postId, error: rpcError } = await supabase.rpc("create_post", {
    p_type: BD_TYPE_BY_UI[type],
    p_body: body,
    p_title: title,
    p_room_id: roomId,
    p_child_ids: audience.kind === "kids" ? audience.slugs : [],
    p_photos: uploadedPaths.map((path, position) => ({
      url: path,
      width: null,
      height: null,
      position,
    })),
  });

  if (rpcError || !postId) {
    console.error("createPostAction: la RPC create_post falló", rpcError);
    await removeUploadedPhotos(supabase, uploadedPaths);
    return { ok: false, message: GENERIC_ERROR };
  }

  return { ok: true };
}
