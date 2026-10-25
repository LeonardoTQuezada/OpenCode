import { cookies } from "next/headers";

import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

type DailySummary = {
  id: string;
  child_id: string;
  date: string;
  meals_count: number;
  sleep_minutes: number;
  activities_count: number;
  mood: string | null;
  highlight: string | null;
  created_at: string;
  children?: {
    full_name: string;
  }[];
};

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Resumen diario del staff — ruta `/staff/day-summary`.
 *  Staff/Admin: resumen consolidado del día de todos los niños de la guardería. */
export default async function StaffDaySummaryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted">No autenticado</p>
      </div>
    );
  }

  // Obtener todos los resúmenes de hoy con información del niño
  const today = new Date().toISOString().slice(0, 10);
  const { data: summaries, error } = await supabase
    .from("daily_summaries")
    .select(`
      id,
      child_id,
      date,
      meals_count,
      sleep_minutes,
      activities_count,
      mood,
      highlight,
      created_at,
      children (full_name)
    `)
    .eq("date", today)
    .order("child_id");

  if (error) {
    throw new Error(`No se pudieron cargar los resúmenes: ${error.message}`);
  }

  const summariesList = (summaries ?? []) as DailySummary[];

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="staff" active={null} />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="staff" active={null} />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-coral-strong">
              RESUMEN DEL DÍA
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
              Resumen diario de la guardería
            </h1>
            <p className="mt-[5px] text-[14.5px] leading-[1.36] text-faint">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          {summariesList.length === 0 ? (
            <div className="rounded-2xl border border-card-border bg-card p-6 text-center shadow-card">
              <p className="text-[15px] text-muted">
                Aún no hay resúmenes disponibles para hoy.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {summariesList.map((summary) => {
                const childName = summary.children?.[0]?.full_name ?? "Niño";
                return (
                  <div
                    key={summary.id}
                    className="rounded-2xl border border-card-border bg-card p-6 shadow-card"
                  >
                    <h2 className="mb-4 font-display text-[20px] font-semibold text-ink">
                      {childName}
                    </h2>
                    <div className="rounded-xl bg-cream-soft p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-bold text-muted">Comidas</p>
                          <p className="text-lg font-semibold text-ink">{summary.meals_count}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted">Sueño</p>
                          <p className="text-lg font-semibold text-ink">
                            {Math.floor(summary.sleep_minutes / 60)}h {summary.sleep_minutes % 60}m
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted">Actividades</p>
                          <p className="text-lg font-semibold text-ink">{summary.activities_count}</p>
                        </div>
                      </div>
                      {summary.mood && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-muted">Ánimo</p>
                          <p className="text-sm text-ink">{summary.mood}</p>
                        </div>
                      )}
                      {summary.highlight && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-muted">Lo más lindo del día</p>
                          <p className="text-sm text-ink">{summary.highlight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
