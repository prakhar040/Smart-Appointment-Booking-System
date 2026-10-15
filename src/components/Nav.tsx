"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Book an appointment" },
  { href: "/booking", label: "Find my booking" },
  { href: "/appointments", label: "All appointments" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav aria-label="Main navigation" className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
        <Link href="/" className="mr-4 shrink-0 text-sm font-bold tracking-tight text-emerald-900">
          Care<span className="text-gray-400">/</span>Appointments
        </Link>
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                active
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
