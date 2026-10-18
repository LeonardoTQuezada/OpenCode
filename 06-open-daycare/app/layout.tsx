import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { PostsProvider } from "@/components/posts-provider";
import { UserProfileProvider } from "@/components/user-profile-provider";
import { childToKidChip, getSessionChildren } from "@/lib/feed-kids";
import { getSessionProfile } from "@/utils/supabase/profile";

import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenDayCare",
  description: "OpenDayCare — la app de tu guardería",
};

// Sin esto, next build prerenderiza los children una sola vez y los chips del
// modal quedarían congelados con los datos del build (next.config.ts no
// habilita cacheComponents). Mismo criterio que las páginas de /kids (SPEC 10).
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Chips reales del modal "Nueva publicación" (SPEC 10): children activos
  // de la guardería, adaptados al shape Kid que consume el feed.
  const kids = (await getSessionChildren()).map(childToKidChip);
  // Perfil del usuario autenticado (null en /login): alimenta el sidebar
  // y los avatares. Con force-dynamic se resuelve en cada request.
  const profile = await getSessionProfile();

  return (
    <html
      lang="es"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UserProfileProvider profile={profile}>
          <PostsProvider initialKids={kids}>{children}</PostsProvider>
        </UserProfileProvider>
      </body>
    </html>
  );
}