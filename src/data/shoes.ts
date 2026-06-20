export interface Shoe {
  id: number;
  name: string;
  brand: string;
  colorway: string;
  price: number;
  sale_price?: number;
  image: string;
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

const img = (seed: string | number) => `https://picsum.photos/seed/sole-${seed}/800/800`;

export const BRANDS = [
  "Nike", "Jordan", "Adidas", "New Balance", "Puma", "Converse",
  "Vans", "Reebok", "Asics", "Salomon", "On Running", "Hoka",
  "Yeezy", "Off-White", "Supreme", "Stone Island", "Palace", "Stüssy",
];

export const CATEGORIES = [
  { id: "running", label: "RUNNING", fa: "برای هر مسیر", icon: "🏃", accent: "#c8f135" },
  { id: "basketball", label: "BASKETBALL", fa: "از زمین تا خیابون", icon: "🏀", accent: "#ff5c00" },
  { id: "lifestyle", label: "LIFESTYLE", fa: "روزمره، استایل‌دار", icon: "👟", accent: "#7b2fbe" },
  { id: "skateboarding", label: "SKATEBOARDING", fa: "برای خیابون", icon: "🛹", accent: "#f5f5f0" },
  { id: "trail", label: "TRAIL", fa: "طبیعت رو فتح کن", icon: "🌲", accent: "#d4a84a" },
  { id: "luxury", label: "LUXURY", fa: "بالاترین سطح", icon: "💎", accent: "#c8f135" },
] as const;

const sneakers: Array<Omit<Shoe, "id" | "image" | "sku">> = [
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
  { name: "Box Logo Hoodie SB Dunk", brand: "Supreme", colorway: "Pure Red", price: 16500000, category: "luxury", sizes: [42,43,44], isNew: true, isLimited: true, isSoldOut: false, rating: 4.7, reviews: 67, colors: ["#ef4444","#fff"], tags: ["hype","collab"] },
  { name: "1080 V13", brand: "New Balance", colorway: "Black Castlerock", price: 7400000, category: "running", sizes: [40,41,42,43,44,45], isNew: true, isLimited: false, isSoldOut: false, rating: 4.8, reviews: 178, colors: ["#0a0a0a","#888"], tags: ["daily-trainer"] },
  { name: "ACS Pro", brand: "Stone Island", colorway: "Olive Tech", price: 14200000, category: "luxury", sizes: [41,42,43,44,45], isNew: true, isLimited: true, isSoldOut: false, rating: 4.5, reviews: 43, colors: ["#4a6741","#0a0a0a"], tags: ["techwear"] },
  { name: "Forum Low", brand: "Adidas", colorway: "Bad Bunny", price: 8900000, category: "lifestyle", sizes: [40,41,42,43,44], isNew: false, isLimited: true, isSoldOut: true, rating: 4.7, reviews: 312, colors: ["#d4a84a","#fff"], tags: ["collab"] },
  { name: "Pro Leather", brand: "Converse", colorway: "Egret", price: 3400000, category: "basketball", sizes: [40,41,42,43,44,45], isNew: false, isLimited: false, isSoldOut: false, rating: 4.4, reviews: 156, colors: ["#fff","#0a0a0a"], tags: ["retro"] },
  { name: "Pearl Court", brand: "Palace", colorway: "Stüssy Edition", price: 9800000, category: "lifestyle", sizes: [41,42,43,44], isNew: true, isLimited: true, isSoldOut: false, rating: 4.6, reviews: 78, colors: ["#fff","#c8f135"], tags: ["collab","hype"] },
];

export const SHOES: Shoe[] = sneakers.map((s, i) => ({
  ...s,
  id: i + 1,
  image: img(i + 1),
  sku: `SOLE-${String(i + 1).padStart(4, "0")}`,
}));

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(n) + " تومان";
