"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
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

  return (
    <div className="admin-panel min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border bg-[var(--sidebar)] p-5 hidden md:block">
        <p className="font-bold text-lg mb-6 text-foreground">Mama&apos;s Kitchen</p>
        <AdminNav />
        <Button
          variant="ghost"
          className="w-full justify-start mt-6 font-semibold text-base"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </aside>
      <main className="flex-1 overflow-auto p-5 md:p-8">{children}</main>
    </div>
  );
}
