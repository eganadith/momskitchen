"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ListOrdered, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <Button
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start font-semibold text-base h-11",
                active && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {link.label}
            </Button>
          </Link>
        );
      })}
      <Link href="/" className="mt-4">
        <Button variant="outline" className="w-full justify-start font-semibold text-base h-11">
          View site
        </Button>
      </Link>
    </nav>
  );
}
