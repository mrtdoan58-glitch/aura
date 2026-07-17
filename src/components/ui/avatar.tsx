import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string;
  alt?: string;
  size?: number;
  ring?: boolean;
  online?: boolean;
  className?: string;
}

export function Avatar({ src, alt = "", size = 44, ring, online, className }: AvatarProps) {
  const inner = (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", ring && "border-[2.5px] border-bg")}
      style={{ width: size, height: size }}
    />
  );
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {ring ? (
        <div className="story-ring rounded-full p-[2.5px]" style={{ width: size, height: size }}>
          {inner}
        </div>
      ) : (
        <div className={className}>{inner}</div>
      )}
      {online && (
        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-success border-[2.5px] border-bg" />
      )}
    </div>
  );
}
