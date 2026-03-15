"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      return;
    }
    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) setAuthorized(true);
        else setAuthorized(false);
      })
      .catch(() => setAuthorized(false));
  }, [isLoginPage]);

  useEffect(() => {
    if (!isLoginPage && authorized === false) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, authorized, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (isLoginPage) return <>{children}</>;
  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!authorized) return null;

  const sidebarContent = (
    <>
      <p className="font-bold text-lg mb-6 text-foreground">Mama&apos;s Kitchen</p>
      <AdminNav onNavigate={() => setMobileNavOpen(false)} />
      <Button
        variant="ghost"
        className="w-full justify-start mt-6 font-semibold text-base"
        onClick={() => {
          setMobileNavOpen(false);
          handleLogout();
        }}
      >
        <LogOut className="mr-2 h-5 w-5" />
        Log out
      </Button>
    </>
  );

  return (
    <div className="admin-panel min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="w-60 border-r border-border bg-[var(--sidebar)] p-5 hidden md:block shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile header + menu */}
      <div className="md:hidden flex items-center justify-between gap-4 border-b border-border bg-[var(--sidebar)] px-4 py-3 shrink-0">
        <span className="font-bold text-lg text-foreground">Mama&apos;s Kitchen</span>
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <SheetContent side="left" className="w-[280px] max-w-[85vw] pt-14">
            <div className="p-2">{sidebarContent}</div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-8 min-h-0">{children}</main>
    </div>
  );
}
