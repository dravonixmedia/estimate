import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "mark";
  theme?: "light" | "dark";
  className?: string;
  href?: string | null;
  priority?: boolean;
};

const SOURCES = {
  full: {
    light: "/brand/logo-light.png",
    dark: "/brand/logo-dark.png",
  },
  mark: {
    light: "/brand/icon.png",
    dark: "/brand/icon.png",
  },
} as const;

// Matches each source file's real pixel aspect ratio so next/image never
// stretches or letterboxes it.
const DIMENSIONS = {
  full: {
    light: { width: 3207, height: 710 },
    dark: { width: 3600, height: 1028 },
  },
  mark: {
    light: { width: 797, height: 710 },
    dark: { width: 797, height: 710 },
  },
} as const;

/**
 * The single reusable Logo component. Every surface in the app (header,
 * footer, admin login, PDF) renders the brand mark through this component
 * instead of inlining an <img> — keeps the asset path, aspect ratio and
 * clear space consistent everywhere.
 */
export function Logo({ variant = "full", theme = "light", className, href = "/", priority }: LogoProps) {
  const src = SOURCES[variant][theme];
  const { width, height } = DIMENSIONS[variant][theme];

  const image = (
    <Image
      src={src}
      alt="Dravonix Media"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto", className)}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} aria-label="Dravonix Media home" className="inline-flex items-center">
      {image}
    </Link>
  );
}
