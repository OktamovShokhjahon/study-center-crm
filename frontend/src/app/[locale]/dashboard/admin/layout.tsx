"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <>
        <AppHeader />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px] flex-col md:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1 border-t border-[var(--border)] bg-[var(--background)]/40 md:border-l md:border-t-0">
          <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </div>
      </div>
    </>
  );
}
