import heroShoe from "@/assets/hero-shoe.jpg";
import hype1 from "@/assets/hype-1.jpg";
import hype2 from "@/assets/hype-2.jpg";
import hype3 from "@/assets/hype-3.jpg";
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

// Curated, verified Unsplash sneaker photo IDs (real shoe photography)
const SNEAKER_PHOTOS = [
  "1542291026-7eec264c27ff",
  "1600269452121-4f2416e55c28",
  "1606107557195-0e29a4b5b4aa",
  "1551107696-a4b0c5a0d9a2",
  "1595950653106-6c9ebd614d3a",
  "1525966222134-fcfa99b8ae77",
  "1460353581641-37baddab0fa2",
  "1491553895911-0055eca6402d",
  "1556906781-9a412961c28c",
  "1539185441755-769473a23570",
  "1542219550-37153d387c27",
  "1552346154-21d32810aba3",
  "1608231387042-66d1773070a5",
  "1546435770-a3e426bf472b",
  "1518894781321-630e638d0742",
  "1614252369475-531eba835eb1",
  "1465453869711-7e174808ace9",
  "1605408499391-6368c628ef42",
  "1620641788421-7a1c342ea42e",
];

const usp = (i: number, crop = "entropy") =>
  `https://images.unsplash.com/photo-${SNEAKER_PHOTOS[i % SNEAKER_PHOTOS.length]}?w=900&h=900&fit=crop&crop=${crop}&auto=format&q=78`;

// 4 "angles" per shoe by rotating crop + offset through the pool
const angles = (start: number): string[] => [
  usp(start, "entropy"),
  usp(start + 5, "edges"),
  usp(start + 11, "center"),
  usp(start + 17, "entropy"),
];

export const BRANDS = [
  "Nike", "Jordan", "Adidas", "New Balance", "Puma", "Converse",
  "Vans", "Reebok", "Asics", "Salomon", "On Running", "Hoka",
  "Yeezy", "Off-White", "Supreme", "Stone Island", "Palace", "Stüssy",
];

// simpleicons CDN slugs for brands that have logos available
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

const sneakers: Array<Omit<Shoe, "id" | "image" | "images" | "sku">> = [
  { name: "Air Max 97", brand: "Nike", colorway: "Silver Bullet", price: 5800000, category: "lifestyle", sizes: [40,41,42,43,44,45], isNew: true, isLimited: false, isSoldOut: false, rating: 4.8, reviews: 312, colors: ["#c0c0c0","#0a0a0a","#ef4444"], tags: ["icon","retro"] },
  { name: "Air Jordan 1 High OG", brand: "Jordan", colorway: "Chicago", price: 8500000, sale_price: 7200000, category: "basketball", sizes: [41,42,43,44,45], isNew: true, isLimited: true, isSoldOut: false, rating: 4.9, reviews: 891, colors: ["#ef4444","#ffffff","#0a0a0a"], tags: ["grail","og"] },
  { name: "Yeezy Boost 350 V2", brand: "Yeezy", colorway: "Zebra", price: 12500000, category: "lifestyle", sizes: [40,41,42,43], isNew: false, isLimited: true, isSoldOut: false, rating: 4.7, reviews: 542, colors: ["#ffffff","#0a0a0a"], tags: ["limited"] },
  { name: "1906R", brand: "New Balance", colorway: "Protection Pack", price: 6400000, category: "lifestyle", sizes: [40,41,42,43,44,45,46], isNew: true, isLimited: false, isSoldOut: false, rating: 4.6, reviews: 203, colors: ["#888","#d4a84a"], tags: ["dad"] },
  { name: "Gel-Kayano 14", brand: "Asics", colorway: "Cream White", price: 4900000, category: "running", sizes: [40,41,42,43,44], isNew: false, isLimited: false, isSoldOut: false, rating: 4.5, reviews: 178, colors: ["#f5f5f0","#888"], tags: ["y2k"] },
  { name: "XT-6", brand: "Salomon", colorway: "Advanced Black", price: 7800000, category: "trail", sizes: [41,42,43,44,45], isNew: true, isLimited: false, isSoldOut: false, rating: 4.8, reviews: 421, colors: ["#0a0a0a","#c8f135"], tags: ["techwear"] },
  { name: "Dunk Low", brand: "Nike", colorway: "Panda", price: 4200000, category: "lifestyle", sizes: [40,41,42,43,44], isNew: false, isLimited: false, isSoldOut: true, rating: 4.9, reviews: 1203, colors: ["#fff","#0a0a0a"], tags: ["hype"] },
  { name: "Chuck 70 High", brand: "Converse", colorway: "Parchment", price: 2400000, category: "skateboarding", sizes: [39,40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.4, reviews: 322, colors: ["#f5f5f0","#0a0a0a"], tags: ["classic"] },
  { name: "Cloud X 3", brand: "On Running", colorway: "Eclipse", price: 6900000, category: "running", sizes: [40,41,42,43,44], isNew: true, isLimited: false, isSoldOut: false, rating: 4.7, reviews: 156, colors: ["#0a0a0a","#7b2fbe"], tags: ["tech"] },
  { name: "Clifton 9", brand: "Hoka", colorway: "Cyclamen", price: 5400000, category: "running", sizes: [40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.6, reviews: 289, colors: ["#ff5c00","#fff"], tags: ["max-cushion"] },
  { name: "Samba OG", brand: "Adidas", colorway: "Cloud White", price: 3800000, category: "lifestyle", sizes: [40,41,42,43,44,45], isNew: true, isLimited: false, isSoldOut: false, rating: 4.8, reviews: 678, colors: ["#fff","#0a0a0a"], tags: ["terrace"] },
  { name: "Suede Classic", brand: "Puma", colorway: "Black Gold", price: 2800000, category: "lifestyle", sizes: [40,41,42,43,44], isNew: false, isLimited: false, isSoldOut: false, rating: 4.3, reviews: 198, colors: ["#0a0a0a","#d4a84a"], tags: ["heritage"] },
  { name: "Old Skool", brand: "Vans", colorway: "Black White", price: 2200000, category: "skateboarding", sizes: [39,40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.6, reviews: 845, colors: ["#0a0a0a","#fff"], tags: ["skate"] },
  { name: "Club C 85", brand: "Reebok", colorway: "Vintage White", price: 2900000, category: "lifestyle", sizes: [40,41,42,43,44], isNew: false, isLimited: false, isSoldOut: false, rating: 4.4, reviews: 167, colors: ["#fff","#888"], tags: ["court"] },
  { name: "Air Force 1 '07", brand: "Nike", colorway: "Triple White", price: 3900000, category: "lifestyle", sizes: [39,40,41,42,43,44,45,46], isNew: false, isLimited: false, isSoldOut: false, rating: 4.9, reviews: 2304, colors: ["#fff"], tags: ["classic"] },
  { name: "Air Jordan 4 Retro", brand: "Jordan", colorway: "Bred Reimagined", price: 11200000, category: "basketball", sizes: [41,42,43,44,45], isNew: true, isLimited: true, isSoldOut: false, rating: 4.9, reviews: 432, colors: ["#0a0a0a","#ef4444"], tags: ["grail"] },
  { name: "Ultraboost 1.0", brand: "Adidas", colorway: "Core Black", price: 7200000, category: "running", sizes: [40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.7, reviews: 532, colors: ["#0a0a0a"], tags: ["boost"] },
  { name: "550 White Green", brand: "New Balance", colorway: "Aimé Leon Dore", price: 9500000, category: "lifestyle", sizes: [41,42,43,44], isNew: false, isLimited: true, isSoldOut: false, rating: 4.8, reviews: 287, colors: ["#fff","#c8f135"], tags: ["collab"] },
  { name: "Air Max 90", brand: "Nike", colorway: "Infrared", price: 5200000, category: "lifestyle", sizes: [40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.7, reviews: 689, colors: ["#fff","#ef4444","#888"], tags: ["heritage"] },
  { name: "Speedcross 6", brand: "Salomon", colorway: "Black Phantom", price: 6800000, category: "trail", sizes: [40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.8, reviews: 412, colors: ["#0a0a0a","#888"], tags: ["trail"] },
  { name: "Bondi 8", brand: "Hoka", colorway: "Black Black", price: 6200000, category: "running", sizes: [40,41,42,43,44], isNew: true, isLimited: false, isSoldOut: false, rating: 4.6, reviews: 198, colors: ["#0a0a0a"], tags: ["max-cushion"] },
  { name: "Air Jordan 11 Retro", brand: "Jordan", colorway: "Space Jam", price: 13500000, category: "basketball", sizes: [41,42,43,44,45,46], isNew: false, isLimited: true, isSoldOut: false, rating: 5.0, reviews: 1102, colors: ["#0a0a0a","#7b2fbe"], tags: ["grail","retro"] },
  { name: "Sk8-Hi", brand: "Vans", colorway: "Black White", price: 2600000, category: "skateboarding", sizes: [39,40,41,42,43,44], isNew: false, isLimited: false, isSoldOut: false, rating: 4.5, reviews: 612, colors: ["#0a0a0a","#fff"], tags: ["skate"] },
  { name: "RS-X Efekt", brand: "Puma", colorway: "Better Beige", price: 4100000, category: "lifestyle", sizes: [40,41,42,43,44], isNew: true, isLimited: false, isSoldOut: false, rating: 4.4, reviews: 142, colors: ["#d4a84a","#fff"], tags: ["chunky"] },
  { name: "Out Of Office", brand: "Off-White", colorway: "Cream Black", price: 18000000, category: "luxury", sizes: [41,42,43,44], isNew: false, isLimited: true, isSoldOut: false, rating: 4.6, reviews: 89, colors: ["#f5f5f0","#0a0a0a"], tags: ["designer"] },
  { name: "Yeezy Foam Runner", brand: "Yeezy", colorway: "MX Cream Clay", price: 7800000, category: "lifestyle", sizes: [41,42,43,44,45], isNew: false, isLimited: true, isSoldOut: false, rating: 4.3, reviews: 234, colors: ["#d4a84a","#c4654a"], tags: ["foam"] },
  { name: "Box Logo SB Dunk", brand: "Supreme", colorway: "Pure Red", price: 16500000, category: "luxury", sizes: [42,43,44], isNew: true, isLimited: true, isSoldOut: false, rating: 4.7, reviews: 67, colors: ["#ef4444","#fff"], tags: ["hype","collab"] },
  { name: "1080 V13", brand: "New Balance", colorway: "Black Castlerock", price: 7400000, category: "running", sizes: [40,41,42,43,44,45], isNew: true, isLimited: false, isSoldOut: false, rating: 4.8, reviews: 178, colors: ["#0a0a0a","#888"], tags: ["daily-trainer"] },
  { name: "ACS Pro", brand: "Stone Island", colorway: "Olive Tech", price: 14200000, category: "luxury", sizes: [41,42,43,44,45], isNew: true, isLimited: true, isSoldOut: false, rating: 4.5, reviews: 43, colors: ["#4a6741","#0a0a0a"], tags: ["techwear"] },
  { name: "Forum Low", brand: "Adidas", colorway: "Bad Bunny", price: 8900000, category: "lifestyle", sizes: [40,41,42,43,44], isNew: false, isLimited: true, isSoldOut: true, rating: 4.7, reviews: 312, colors: ["#d4a84a","#fff"], tags: ["collab"] },
  { name: "Pro Leather", brand: "Converse", colorway: "Egret", price: 3400000, category: "basketball", sizes: [40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.4, reviews: 156, colors: ["#fff","#0a0a0a"], tags: ["retro"] },
  { name: "Pearl Court", brand: "Palace", colorway: "Stüssy Edition", price: 9800000, category: "lifestyle", sizes: [41,42,43,44], isNew: true, isLimited: true, isSoldOut: false, rating: 4.6, reviews: 78, colors: ["#fff","#c8f135"], tags: ["collab","hype"] },
];

// Specific featured shoes get the hand-crafted hero/hype renders
const FEATURED_OVERRIDES: Record<number, string> = {
  2: heroShoe,  // AJ1 Chicago
  3: hype1,     // Yeezy 350 Zebra
  16: hype2,    // AJ4 Bred
  22: hype3,    // AJ11 Space Jam
};

export const SHOES: Shoe[] = sneakers.map((s, i) => {
  const id = i + 1;
  const baseImages = angles(i);
  const primary = FEATURED_OVERRIDES[id] ?? baseImages[0];
  return {
    ...s,
    id,
    image: primary,
    images: [primary, baseImages[1], baseImages[2], baseImages[3]],
    sku: `SOLE-${String(id).padStart(4, "0")}`,
  };
});

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(n) + " تومان";
