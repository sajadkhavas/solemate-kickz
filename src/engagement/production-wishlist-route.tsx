import { createFileRoute } from "@tanstack/react-router";

import { ProductionWishlistPage } from "@/engagement/ProductionWishlistPage";

export const Route = createFileRoute("/wishlist")({
  component: ProductionWishlistPage,
});
