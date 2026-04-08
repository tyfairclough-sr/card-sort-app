import Image from "next/image";

/** Brand wordmark from `/public/logo.svg` (135×26, embedded raster). */
export function AppLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Research tools"
      width={135}
      height={26}
      className={className ?? "h-7 w-auto max-w-[min(100%,10.5rem)] shrink-0"}
      priority
    />
  );
}
