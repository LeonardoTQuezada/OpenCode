import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { getAllAnnouncements } from "@/lib/notices";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Avisos del staff — ruta `/staff/notices`.
 *  Muestra noticias internas del equipo + noticias de familia (todos los announcements). */
export default async function StaffNoticesPage() {
  const announcements = await getAllAnnouncements();

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="staff" active="notices" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="staff" active="notices" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-coral-strong">
              AVISOS
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
              Noticias y anuncios
            </h1>
            <p className="mt-[5px] text-[14.5px] leading-[1.36] text-faint">
              Noticias internas del equipo y anuncios de la guardería
            </p>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-2xl border border-card-border bg-card p-6 text-center shadow-card">
              <p className="text-[15px] text-muted">
                No hay noticias ni anuncios en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-2xl border border-card-border bg-card px-[22px] py-5 shadow-card"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12.5px] font-extrabold text-coral-strong">
                      ANUNCIO
                    </span>
                    <span className="text-[12.5px] text-muted">{announcement.time}</span>
                  </div>
                  <h2 className="mb-2 font-display text-[18px] font-semibold text-ink">
                    {announcement.title}
                  </h2>
                  <p className="text-[15px] leading-[1.55] text-body">{announcement.body}</p>
                  {announcement.photo && (
                    <div className="mt-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={announcement.photo}
                        alt="Foto del anuncio"
                        className="w-full rounded-2xl object-cover"
                        style={{ height: 200 }}
                      />
                    </div>
                  )}
                  <div className="mt-3 text-[12.5px] text-muted">
                    Publicado por {announcement.authorName}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
