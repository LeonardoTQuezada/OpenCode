import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { PostsProvider } from "@/components/posts-provider";
import { UserProfileProvider } from "@/components/user-profile-provider";
import { readKids } from "@/lib/data";
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

// Sin esto, next build prerenderiza data/kids.json una sola vez y los chips del
// modal quedarían congelados con los datos del build (next.config.ts no
// habilita cacheComponents). Mismo criterio que app/kids/layout.tsx (SPEC 05).
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const kids = await readKids();
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