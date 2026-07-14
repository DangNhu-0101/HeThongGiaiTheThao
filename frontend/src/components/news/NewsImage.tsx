import { newsFallbackImage } from "@/utils/newsDisplay";

const NewsImage = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => (
  <img
    src={src || newsFallbackImage}
    alt={alt}
    className={className}
    onError={(event) => {
      event.currentTarget.src = newsFallbackImage;
    }}
  />
);

export default NewsImage;
