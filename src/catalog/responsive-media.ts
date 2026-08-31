import type { Shoe } from "@/data/shoes";

export type ResponsiveImageSource = {
  url: string;
  width: number;
  height: number;
  format: "webp";
  sha256: string;
};

export type ResponsiveProductMedia = {
  assetUuid: string;
  role: string;
  sortOrder: number;
  altText: string;
  src: string;
  srcSet: string;
  sources: ResponsiveImageSource[];
};

export type ResponsiveShoe = Shoe & {
  responsiveMedia?: ResponsiveProductMedia[];
};

export function responsiveMediaFor(shoe: Shoe, src: string): ResponsiveProductMedia | undefined {
  return (shoe as ResponsiveShoe).responsiveMedia?.find((item) => item.src === src);
}
