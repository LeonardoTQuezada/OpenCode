import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Placeholder de `/family-feed` (SPEC 03): el feed familiar llega en una
 *  spec futura. No existe ítem de nav familiar, por eso reutiliza `active="feed"`. */
export default function FamilyFeedPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="feed" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="feed" />
        <main className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Feed familiar
          </h1>
        </main>
      </div>
    </div>
  );
}
