"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

const LINKS = [
  { href: "/", label: "Book a visit" },
  { href: "/booking", label: "Sign in" },
  { href: "/appointments", label: "My visits" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [patientEmail, setPatientEmail] = useState<string | null>(null);
  useEffect(() => {
    api.patientSession().then((session) => setPatientEmail(session.email)).catch(() => setPatientEmail(null));
  }, [pathname]);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const landingSignedOut = pathname === "/" && !patientEmail;
  const visibleLinks = LINKS.filter((link) => {
    if (patientEmail && link.href === "/booking") return false;
    if (landingSignedOut && link.href !== "/") return false;
    return true;
  });

  return (
    <nav aria-label="Main navigation" className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>morrow<span className="brand-period">.</span><small>care, made a little easier</small></span>
        </Link>
        <div className="nav-links">{visibleLinks.map((link) => {
          const href = link.href === "/" && !patientEmail ? "/booking" : link.href;
          const active = link.href === "/" ? pathname === "/" : isActive(link.href);
          return (
            <Link
              key={link.href}
              href={href}
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
        })}
          {patientEmail ? (
            <button type="button" className="nav-link" onClick={async () => { await api.patientLogout(); setPatientEmail(null); router.push("/"); }}>Sign out</button>
          ) : !landingSignedOut ? (
            <Link href="/sign-up" className="nav-link">Create account</Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
