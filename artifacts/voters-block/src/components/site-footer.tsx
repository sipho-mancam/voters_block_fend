import { Link } from "wouter";

const socialLinks = [
  {
    label: "Seb4Vision on X",
    href: "https://twitter.com/seb4vision",
    icon: "https://seb4vision.co.za/wp-content/uploads/2022/03/Twitter-Icon.png",
  },
  {
    label: "Seb4Vision on Instagram",
    href: "https://www.instagram.com/seb4vision/",
    icon: "https://seb4vision.co.za/wp-content/uploads/2022/03/instagram-icon.png",
  },
  {
    label: "Seb4Vision on Facebook",
    href: "https://www.facebook.com/Seb4vision-260943068163722/",
    icon: "https://seb4vision.co.za/wp-content/uploads/2022/03/facebook-icon.png",
  },
  {
    label: "Seb4Vision on YouTube",
    href: "https://www.youtube.com/channel/UCvsz7Qw3yo5hFa6R8HTvh1g",
    icon: "https://seb4vision.co.za/wp-content/uploads/2022/03/youtube-icon.png",
  },
  {
    label: "Seb4Vision on LinkedIn",
    href: "https://za.linkedin.com/company/seb4vision-pty-ltd",
    icon: "https://seb4vision.co.za/wp-content/uploads/2022/04/linkedin.png",
  },
];

export function SiteFooter({ showContactLink = false }: { showContactLink?: boolean }) {
  return (
    <footer className="border-t border-white/10 bg-secondary px-5 py-7 text-secondary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
        <nav aria-label="Seb4Vision social media">
          <ul className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 p-2 transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <img src={link.icon} alt="" className="h-full w-full object-contain" loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4 font-mono text-xs text-white/70">
          {showContactLink && <Link href="/contact" className="font-bold uppercase text-white hover:text-primary">Contact us</Link>}
          <p>© {new Date().getFullYear()} Seb4Vision. <span>All rights reserved.</span></p>
        </div>
      </div>
    </footer>
  );
}