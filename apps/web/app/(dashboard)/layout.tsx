import { AppShell } from '@/components/layout/app-shell';
import { ToastContainer } from '@/components/ui/toast';
import { ThemeApplier } from '@/components/theme-applier';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeApplier />
      <AppShell>{children}</AppShell>
      <ToastContainer />
    </>
  );
}
