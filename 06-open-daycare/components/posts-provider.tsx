"use client";

// Estado del composer (SPEC 06 + SPEC 13): este provider controla si el
// modal "Nueva publicación" está abierto y reparte los chips de niños.
// El modal se monta solo mientras composerOpen sea true, así cada apertura
// crea una instancia nueva y el formulario arranca vacío. Los posts ya no
// viven en memoria: el feed los lee server-side desde Supabase.

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import type { Kid } from "@/lib/kids";

import { CreatePostModal } from "./create-post-modal";

type PostsContextValue = {
  kids: Kid[];
  composerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({
  initialKids,
  children,
}: {
  initialKids: Kid[];
  children: ReactNode;
}) {
  const [composerOpen, setComposerOpen] = useState(false);

  const closeComposer = useCallback(() => setComposerOpen(false), []);

  const openComposer = useCallback(() => setComposerOpen(true), []);

  return (
    <PostsContext.Provider
      value={{ kids: initialKids, composerOpen, openComposer, closeComposer }}
    >
      {children}

      {/* Solo monta mientras está abierto: reabrir arranca con el form vacío */}
      {composerOpen && (
        <CreatePostModal kids={initialKids} onClose={closeComposer} />
      )}
    </PostsContext.Provider>
  );
}

/** Hook del contexto: falla con un error claro si se usa fuera del layout. */
export function usePosts(): PostsContextValue {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePosts se usa fuera de <PostsProvider> (app/layout.tsx).");
  }
  return context;
}
