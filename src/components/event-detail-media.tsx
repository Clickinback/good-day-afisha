import Image from "next/image";

export function EventDetailMedia({ src, alt, category }: { src: string; alt: string; category: string }) {
  return <div className="detail-image">
    <Image
      className="media-foreground"
      src={src}
      alt={alt}
      width={800}
      height={1200}
      priority
      sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 900px) 560px, 38vw"
    />
    <span>{category}</span>
  </div>;
}
