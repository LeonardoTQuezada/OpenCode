"use client";

// Estado compartido del feed (SPEC 06): los posts publicados viven en memoria
// (se pierden al recargar) y este provider monta el modal "Nueva publicación"
// mientras composerOpen sea true, así cada apertura crea una instancia nueva
// y el formulario arranca vacío.

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import type { Kid } from "@/lib/kids";
import { createPost, SEED_POSTS, type NewPostInput, type Post } from "@/lib/posts";

import { CreatePostModal } from "./create-post-modal";

type PostsContextValue = {
  posts: Post[];
  kids: Kid[];
  composerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  /** Crea el post con la hora actual y lo deja primero en el feed. */
  addPost: (input: NewPostInput) => void;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({
  initialKids,
  children,
}: {
  initialKids: Kid[];
  children: ReactNode;
}) {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [composerOpen, setComposerOpen] = useState(false);

  const closeComposer = useCallback(() => setComposerOpen(false), []);

  const openComposer = useCallback(() => setComposerOpen(true), []);

  const addPost = useCallback(
    (input: NewPostInput) => {
      setPosts((prev) => [createPost(input, initialKids, new Date()), ...prev]);
    },
    [initialKids],
  );

  return (
    <PostsContext.Provider
      value={{ posts, kids: initialKids, composerOpen, openComposer, closeComposer, addPost }}
    >
      {children}

      {/* Solo monta mientras está abierto: reabrir arranca con el form vacío */}
      {composerOpen && (
        <CreatePostModal
          kids={initialKids}
          onClose={closeComposer}
          onPublish={addPost}
        />
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
