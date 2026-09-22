import { Link } from "wouter";

type BrandLogoProps = {
  variant?: "color" | "white" | "black";
  className?: string;
  showTagline?: boolean;
};

export function BrandLogo({
  variant = "color",
  className = "",
  showTagline = true,
}: BrandLogoProps) {
  const filename = {
    color: "seb4vision-color.png",
    white: "seb4vision-white.png",
    black: "seb4vision-black.png",
  }[variant];

  return (
    <Link
      href="/"
      aria-label="Go to home page"
      className={`block overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      <img
        src={`${import.meta.env.BASE_URL}brand/${filename}`}
        alt="Seb4Vision — Broadcast Enhancement Solutions"
        className={`h-full w-full object-contain ${showTagline ? "" : "scale-[1.28]"}`}
      />
    </Link>
  );
}