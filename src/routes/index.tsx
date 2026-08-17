import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { BrandWall } from "@/components/sections/BrandWall";
import { Categories } from "@/components/sections/Categories";
import { FeaturedDrops } from "@/components/sections/FeaturedDrops";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { HypeSection } from "@/components/sections/HypeSection";
import { MerchandisingShowcase } from "@/components/sections/MerchandisingShowcase";
import { Newsletter } from "@/components/sections/Newsletter";
import { QuickShopPaths } from "@/components/sections/QuickShopPaths";
import { TrustBadges } from "@/components/sections/TrustBadges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOLE — ویترین کفش و استریت‌ویر" },
      {
        name: "description",
        content:
          "تجربه نمایشی فارسی و RTL برای کشف مدل‌ها، دسته‌ها و برندهای موجود در پروژه SOLE. قیمت و موجودی فعلی نمونه هستند.",
      },
    ],
  }),
  component: Home,
});

function PerfSection({ children }: { children: ReactNode }) {
  return (
    <div
      data-f12-content-visibility="auto"
      className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]"
    >
      {children}
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-ink text-foreground">
      <Navbar />
      <main data-testid="home-main">
        <Hero />
        <QuickShopPaths />
        <FeaturedDrops />
        <PerfSection>
          <MerchandisingShowcase />
        </PerfSection>
        <PerfSection>
          <Categories />
        </PerfSection>
        <PerfSection>
          <BrandWall />
        </PerfSection>
        <PerfSection>
          <HypeSection />
        </PerfSection>
        <PerfSection>
          <TrustBadges />
        </PerfSection>
        <PerfSection>
          <Newsletter />
        </PerfSection>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
