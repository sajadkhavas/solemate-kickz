import { createFileRoute } from "@tanstack/react-router";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { BrandWall } from "@/components/sections/BrandWall";
import { Categories } from "@/components/sections/Categories";
import { FeaturedDrops } from "@/components/sections/FeaturedDrops";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { HypeSection } from "@/components/sections/HypeSection";
import { Newsletter } from "@/components/sections/Newsletter";
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

function Home() {
  return (
    <div className="min-h-screen bg-ink text-foreground">
      <Navbar />
      <main data-testid="home-main">
        <Hero />
        <FeaturedDrops />
        <Categories />
        <BrandWall />
        <HypeSection />
        <TrustBadges />
        <Newsletter />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
