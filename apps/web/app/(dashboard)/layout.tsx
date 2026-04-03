import { AppShell } from '@/components/layout/app-shell';
import { ToastContainer } from '@/components/ui/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <ToastContainer />
    </>
  );
}
