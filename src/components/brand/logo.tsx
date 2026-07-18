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
    light: "/brand/logo-light.svg",
    dark: "/brand/logo-dark.svg",
  },
  mark: {
    light: "/brand/icon.svg",
    dark: "/brand/icon.svg",
  },
} as const;

const DIMENSIONS = {
  full: { width: 158, height: 44 },
  mark: { width: 36, height: 36 },
} as const;

/**
 * The single reusable Logo component. Every surface in the app (header,
 * footer, admin login, PDF) renders the brand mark through this component
 * instead of inlining an <img> — keeps the asset path, aspect ratio and
 * clear space consistent everywhere.
 */
export function Logo({ variant = "full", theme = "light", className, href = "/", priority }: LogoProps) {
  const src = SOURCES[variant][theme];
  const { width, height } = DIMENSIONS[variant];

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
