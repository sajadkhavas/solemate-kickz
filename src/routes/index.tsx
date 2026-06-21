import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { FeaturedDrops } from "@/components/sections/FeaturedDrops";
import { Categories } from "@/components/sections/Categories";
import { BrandWall } from "@/components/sections/BrandWall";
import { HypeSection } from "@/components/sections/HypeSection";
import { TrustBadges } from "@/components/sections/TrustBadges";
import { Newsletter } from "@/components/sections/Newsletter";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOLE — کفش لوکس و استریت‌ویر" },
      { name: "description", content: "Nike, Jordan, Adidas, Yeezy و بهترین برندهای دنیا. ۲۳۲+ مدل." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="bg-ink text-foreground min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <FeaturedDrops />
        <Categories />
        <HypeSection />
        <BrandWall />
        <TrustBadges />
        <Newsletter />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
