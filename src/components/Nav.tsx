"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Book a visit" },
  { href: "/appointments", label: "Appointments" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>morrow<span className="brand-period">.</span><small>care, made a little easier</small></span>
        </Link>
        <div className="nav-links">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
