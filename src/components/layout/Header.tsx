"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function Header() {
  const count = useCartStore((s) => s.count());
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-12 md:h-14 items-center justify-between px-4 max-w-[980px] mx-auto">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[17px] text-foreground tracking-tight">
          <span className="relative flex h-8 w-8 md:h-9 md:w-9 shrink-0 overflow-hidden rounded-full bg-muted">
            <Image
              src="/logo.jpeg"
              alt="Mama's Kitchen logo"
              fill
              className="object-cover"
              sizes="36px"
              priority
            />
          </span>
          Mama&apos;s Kitchen
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/track">
            <Button variant="ghost" size="sm" className="text-primary font-medium hover:text-primary/80">
              <PackageSearch className="h-4 w-4 mr-1 md:mr-0 md:hidden" />
              <span className="hidden md:inline">Track order</span>
            </Button>
          </Link>
          <Link href="/menu">
            <Button variant="ghost" size="sm" className="text-primary font-medium hover:text-primary/80">
              Menu
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-foreground">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
