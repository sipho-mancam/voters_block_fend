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
  return (
    <Link
      href="/"
      aria-label="SuperSport Voters Block — home"
      data-testid="link-brand-home"
      className={`block shrink-0 overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      <img
        src={`${import.meta.env.BASE_URL}brand/supersport-light.webp`}
        alt="SuperSport"
        data-variant={variant}
        data-tagline={showTagline}
        className="h-full w-full object-contain object-left"
      />
    </Link>
  );
}