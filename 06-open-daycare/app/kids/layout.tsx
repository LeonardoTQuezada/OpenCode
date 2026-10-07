// Layout de /kids y /kids/mateo (SPEC 05): lee los JSON en el servidor y los
// reparte por todo el árbol con FamilyProvider. Al montarse una sola vez para
// las dos rutas, el estado sobrevive a la navegación entre ellas.

import type { ReactNode } from "react";

import { FamilyProvider } from "@/components/family-provider";
import { readFamily, readKids } from "@/lib/data";

// Sin esto, next build prerenderiza los JSON una sola vez y la app quedaría
// congelada con los datos del build (next.config.ts no habilita cacheComponents).
export const dynamic = "force-dynamic";

export default async function KidsLayout({ children }: { children: ReactNode }) {
  const [kids, family] = await Promise.all([readKids(), readFamily()]);

  return (
    <FamilyProvider initialKids={kids} initialFamily={family}>
      {children}
    </FamilyProvider>
  );
}
