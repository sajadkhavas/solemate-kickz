import catRunning from "@/assets/cat-running.jpg";
import catBasketball from "@/assets/cat-basketball.jpg";
import catLifestyle from "@/assets/cat-lifestyle.jpg";
import catSkate from "@/assets/cat-skateboarding.jpg";
import catTrail from "@/assets/cat-trail.jpg";
import catLuxury from "@/assets/cat-luxury.jpg";

export interface Shoe {
  id: number;
  name: string;
  brand: string;
  colorway: string;
  price: number;
  sale_price?: number;
  image: string;
  images: string[];
  category: "running" | "basketball" | "lifestyle" | "skateboarding" | "trail" | "luxury";
  sizes: number[];
  isNew: boolean;
  isLimited: boolean;
  isSoldOut: boolean;
  rating: number;
  reviews: number;
  colors: string[];
  sku: string;
  tags: string[];
}

// P01 production safety contract:
// Product, SKU, price and inventory truth must come from sole-backend.
// Until the P02 media/catalog ingestion adapter is connected, production fails closed
// instead of publishing development fixtures as commerce truth.
export const SHOES: Shoe[] = [];

export const BRANDS = [
  "Nike",
  "Jordan",
  "Adidas",
  "New Balance",
  "Puma",
  "Converse",
  "Vans",
  "Reebok",
  "Asics",
  "Salomon",
  "On Running",
  "Hoka",
  "Yeezy",
  "Off-White",
  "Supreme",
  "Stone Island",
  "Palace",
  "Stüssy",
];

export const BRAND_LOGO_SLUGS: Record<string, string> = {
  Nike: "nike",
  Jordan: "jordan",
  Adidas: "adidas",
  Puma: "puma",
  "New Balance": "newbalance",
  Reebok: "reebok",
};

export const CATEGORIES = [
  { id: "running", label: "RUNNING", fa: "برای هر مسیر", icon: "🏃", accent: "#c8f135", image: catRunning },
  { id: "basketball", label: "BASKETBALL", fa: "از زمین تا خیابون", icon: "🏀", accent: "#ff5c00", image: catBasketball },
  { id: "lifestyle", label: "LIFESTYLE", fa: "روزمره، استایل‌دار", icon: "👟", accent: "#7b2fbe", image: catLifestyle },
  { id: "skateboarding", label: "SKATEBOARDING", fa: "برای خیابون", icon: "🛹", accent: "#f5f5f0", image: catSkate },
  { id: "trail", label: "TRAIL", fa: "طبیعت رو فتح کن", icon: "🌲", accent: "#d4a84a", image: catTrail },
  { id: "luxury", label: "LUXURY", fa: "بالاترین سطح", icon: "💎", accent: "#c8f135", image: catLuxury },
] as const;

export const formatPrice = (n: number) => new Intl.NumberFormat("fa-IR").format(n) + " تومان";
