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
    <div className={`overflow-hidden ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}brand/${filename}`}
        alt="Seb4Vision — Broadcast Enhancement Solutions"
        className={`h-full w-full object-contain ${showTagline ? "" : "scale-[1.28]"}`}
      />
    </div>
  );
}