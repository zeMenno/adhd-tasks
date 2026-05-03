import { requireSession } from "@/lib/auth/session";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
