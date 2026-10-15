"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Book a visit" },
  { href: "/booking", label: "Manage a visit" },
  { href: "/appointments", label: "Clinic schedule" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav aria-label="Main navigation" className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>morrow<span className="brand-period">.</span><small>care, made a little easier</small></span>
        </Link>
        <div className="nav-links">{LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`nav-link ${
                active
                  ? "nav-link-active"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          );
        })}</div>
      </div>
    </nav>
  );
}
