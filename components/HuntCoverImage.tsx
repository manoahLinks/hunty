"use client"

import { useState } from "react"
import Image from "next/image"
import { GATEWAY_COUNT, resolveImageSrc } from "@/lib/ipfs"

interface HuntCoverImageProps {
  src?: string
  alt: string
  className?: string
}

export function HuntCoverImage({ src, alt, className }: HuntCoverImageProps) {
  const [gatewayIdx, setGatewayIdx] = useState(0)

  if (!src) {
    return (
      <div className={className}>
        <Image
          src="/static-images/image1.png"
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <Image
        src={resolveImageSrc(src, gatewayIdx)}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        onError={() => {
          if (gatewayIdx < GATEWAY_COUNT - 1) {
            setGatewayIdx((idx) => idx + 1)
          }
        }}
        unoptimized
      />
    </div>
  )
}
