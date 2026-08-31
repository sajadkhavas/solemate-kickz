import { forwardRef, type ImgHTMLAttributes } from "react";

import { responsiveMediaFor } from "@/catalog/responsive-media";
import type { Shoe } from "@/data/shoes";

type ResponsiveCatalogImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  shoe: Shoe;
  src: string;
  sizes?: string;
};

export const ResponsiveCatalogImage = forwardRef<HTMLImageElement, ResponsiveCatalogImageProps>(
  function ResponsiveCatalogImage({ shoe, src, alt, sizes = "100vw", width, height, ...props }, ref) {
    const media = responsiveMediaFor(shoe, src);
    const largest = media?.sources.at(-1);
    const resolvedAlt = media?.altText || alt || "";

    return (
      <picture className="contents">
        {media?.srcSet ? <source type="image/webp" srcSet={media.srcSet} sizes={sizes} /> : null}
        <img
          {...props}
          ref={ref}
          src={src}
          srcSet={media?.srcSet}
          sizes={media?.srcSet ? sizes : undefined}
          alt={resolvedAlt}
          width={width ?? largest?.width}
          height={height ?? largest?.height}
        />
      </picture>
    );
  },
);

ResponsiveCatalogImage.displayName = "ResponsiveCatalogImage";
