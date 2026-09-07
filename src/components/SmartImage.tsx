import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  /** Rendered width hint used for responsive sizing. */
  sizes?: string;
  priority?: boolean;
};

/**
 * Image with lazy loading, async decoding, responsive sizing and a soft
 * skeleton while the file downloads.
 */
export default function SmartImage({ src, alt, className, sizes = "(max-width: 768px) 100vw, 33vw", priority = false }: Props) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return <div className={cn("bg-muted flex items-center justify-center text-muted-foreground text-xs", className)}>No image</div>;
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        className={cn("w-full h-full object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
