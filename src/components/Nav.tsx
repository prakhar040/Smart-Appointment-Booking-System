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

  return (
    <nav aria-label="Main navigation" className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>morrow<span className="brand-period">.</span><small>care, made a little easier</small></span>
        </Link>
        <div className="nav-links">{LINKS.filter((link) => !(patientEmail && link.href === "/booking")).map((link) => {
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
        })}
          {patientEmail ? (
            <button type="button" className="nav-link" onClick={async () => { await api.patientLogout(); setPatientEmail(null); router.push("/"); }}>Sign out</button>
          ) : (
            <Link href="/sign-up" className="nav-link">Create account</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
