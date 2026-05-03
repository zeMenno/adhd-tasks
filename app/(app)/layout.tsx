import { requireSession } from "@/lib/auth/session";
import { getAppHeaderData } from "@/lib/app/header-data";
import { AppUserHeader } from "@/components/layout/AppUserHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const header = await getAppHeaderData(session.householdId, session.userId);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
          <AppUserHeader {...header} userName={session.userName} />
          {children}
        </div>
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
