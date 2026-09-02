import { Heart } from "lucide-react";
import { toast } from "sonner";

import { ProductPurchasePanel as BaseProductPurchasePanel } from "../components/product/ProductPurchasePanel";
import { Button } from "@/components/ui/button";
import type { Shoe } from "@/data/shoes";
import { useProductionWishlistItem } from "@/engagement/production-wishlist-store";

type Props = {
  shoe: Shoe;
  onShare: () => Promise<void>;
};

export function ProductPurchasePanel({ shoe, onShare }: Props) {
  const wishlist = useProductionWishlistItem(shoe);

  const toggle = async () => {
    if (wishlist.status === "unauthorized") {
      toast.error("برای ذخیره علاقه‌مندی وارد حساب شوید.");
      return;
    }
    try {
      const wasWishlisted = wishlist.isWishlisted;
      await wishlist.toggle();
      toast.success(wasWishlisted ? "از علاقه‌مندی حساب حذف شد." : "در علاقه‌مندی حساب ذخیره شد.");
    } catch {
      toast.error("تغییر علاقه‌مندی در Backend انجام نشد.");
    }
  };

  return (
    <div data-p09-authoritative-panel>
      <style>{`[data-p09-authoritative-panel] [data-testid="product-wishlist"] { display: none !important; }`}</style>
      <BaseProductPurchasePanel shoe={shoe} onShare={onShare} />
      <Button
        type="button"
        variant="outline"
        size="lg"
        aria-pressed={wishlist.isWishlisted}
        disabled={wishlist.variantId === null || wishlist.status === "loading"}
        onClick={() => void toggle()}
        data-testid="p09-product-wishlist"
        className="mt-3 min-h-14 rounded-full"
      >
        <Heart
          aria-hidden="true"
          className={wishlist.isWishlisted ? "fill-primary text-primary" : undefined}
        />
        {wishlist.isWishlisted ? "حذف از علاقه‌مندی حساب" : "ذخیره در علاقه‌مندی حساب"}
      </Button>
    </div>
  );
}
