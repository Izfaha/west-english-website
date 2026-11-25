"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/kupon", label: "Generate Kupon", icon: "◇" },
  { href: "/admin/pendaftaran", label: "Data Pendaftaran", icon: "▤" },
  { href: "/admin/aktivitas", label: "Log Aktivitas", icon: "∿" },
];

export function Navigation() {
  const pathname = usePathname();
  return <nav aria-label="Menu admin">{links.map(({ href, label, icon }) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
      <span aria-hidden="true">{icon}</span>{label}
    </Link>
  ))}</nav>;
}

export function CurrentPage() {
  const pathname = usePathname();
  return links.find(({ href }) => href === pathname)?.label ?? "Dashboard";
}
