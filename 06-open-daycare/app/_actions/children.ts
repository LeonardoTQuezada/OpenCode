// Server Actions de children y rooms (SPEC 10): lectura y alta de niños
// contra Supabase. La autorización la resuelve RLS (mismo daycare / staff).

"use server";

import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export interface Room {
  id: string;
  daycare_id: string;
  name: string;
  created_at: string;
}

export interface Child {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string; // ISO date
  enrolled_at: string; // ISO date
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export type CreateChildInput = {
  roomId: string;
  fullName: string;
  birthDate: string; // ISO date (YYYY-MM-DD)
  /** Si falta se usa la fecha de hoy. */
  enrolledAt?: string;
  medicalNotes?: string | null;
  allergyTags?: string[];
  photoConsent?: boolean;
};

/** Crea el cliente server de Supabase con las cookies de la sesión actual. */
async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/** Rooms de una guardería, ordenadas por nombre. */
export async function getRooms(daycareId: string): Promise<Room[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, daycare_id, name, created_at")
    .eq("daycare_id", daycareId)
    .order("name");

  if (error) throw new Error(`No se pudieron cargar las salas: ${error.message}`);

  return (data ?? []) as Room[];
}

/** Children activos de una sala, ordenados por nombre. */
export async function getChildrenByRoom(roomId: string): Promise<Child[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at",
    )
    .eq("room_id", roomId)
    .order("full_name");

  if (error) throw new Error(`No se pudieron cargar los niños: ${error.message}`);

  return (data ?? []) as Child[];
}

/** Todos los children de una guardería agrupados por room (con rooms vacías). */
export async function getAllChildren(
  daycareId: string,
): Promise<{ room: Room; children: Child[] }[]> {
  const supabase = await getClient();

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, daycare_id, name, created_at")
    .eq("daycare_id", daycareId)
    .order("name");

  if (roomsError) {
    throw new Error(`No se pudieron cargar las salas: ${roomsError.message}`);
  }

  const roomList = (rooms ?? []) as Room[];
  if (roomList.length === 0) return [];

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at",
    )
    .in(
      "room_id",
      roomList.map((room) => room.id),
    )
    .order("full_name");

  if (childrenError) {
    throw new Error(`No se pudieron cargar los niños: ${childrenError.message}`);
  }

  const childrenList = (children ?? []) as Child[];

  return roomList.map((room) => ({
    room,
    children: childrenList.filter((child) => child.room_id === room.id),
  }));
}

/** Child por ID, o null si no existe (o no es visible por RLS). */
export async function getChildById(id: string): Promise<Child | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el niño: ${error.message}`);

  return (data ?? null) as Child | null;
}

/** Alta de child. Lanza Error si la inserción falla (p. ej. RLS). */
export async function createChild(input: CreateChildInput): Promise<Child> {
  const supabase = await getClient();

  const row = {
    room_id: input.roomId,
    full_name: input.fullName.trim().replace(/\s+/g, " "),
    birth_date: input.birthDate,
    enrolled_at: input.enrolledAt ?? new Date().toISOString().slice(0, 10),
    medical_notes: input.medicalNotes?.trim() || null,
    allergy_tags: input.allergyTags ?? [],
    photo_consent: input.photoConsent ?? true,
  };

  const { data, error } = await supabase
    .from("children")
    .insert(row)
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(`No se pudo crear el niño: ${error.message}`);

  return data as Child;
}
