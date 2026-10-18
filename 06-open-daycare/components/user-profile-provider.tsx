"use client";

// Contexto con el perfil del usuario de la sesión (nombre, inicial, rol,
// guardería). El layout raíz lo resuelve server-side con getSessionProfile()
// y lo reparte a componentes cliente (sidebar, nav móvil).

import { createContext, useContext, type ReactNode } from "react";

import type { UserProfile } from "@/utils/supabase/profile";

const UserProfileContext = createContext<UserProfile | null>(null);

type UserProfileProviderProps = {
  profile: UserProfile | null;
  children: ReactNode;
};

export function UserProfileProvider({
  profile,
  children,
}: UserProfileProviderProps) {
  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  );
}

/** Perfil del usuario actual, o `null` si no hay sesión (p. ej. en /login). */
export function useUserProfile(): UserProfile | null {
  return useContext(UserProfileContext);
}
