import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-secondary px-5 py-7 text-secondary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
        <Link href="/" className="font-bold uppercase tracking-wide hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Voters Block
        </Link>
        <a
          href="https://supersport.com/"
          target="_blank"
          rel="noreferrer"
          className="text-white/70 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Visit SuperSport
        </a>
      </div>
    </footer>
  );
}