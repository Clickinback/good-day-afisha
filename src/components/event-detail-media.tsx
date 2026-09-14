"use client";

import Image from "next/image";
import { useState } from "react";

const MIN_RATIO = 5 / 8;
const MAX_RATIO = 16 / 9;

export function EventDetailMedia({ src, alt, category }: { src: string; alt: string; category: string }) {
  const [aspectRatio, setAspectRatio] = useState("2 / 3");

  return <div className="detail-image" style={{ aspectRatio }}>
    <Image className="media-backdrop" src={src} alt="" aria-hidden fill sizes="(max-width: 900px) 560px, 38vw" />
    <Image
      className="media-foreground"
      src={src}
      alt={alt}
      fill
      priority
      sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 900px) 560px, 38vw"
      onLoad={(event) => {
        const image = event.currentTarget;
        if (!image.naturalWidth || !image.naturalHeight) return;
        const ratio = Math.min(Math.max(image.naturalWidth / image.naturalHeight, MIN_RATIO), MAX_RATIO);
        setAspectRatio(String(ratio));
      }}
    />
    <span>{category}</span>
  </div>;
}
