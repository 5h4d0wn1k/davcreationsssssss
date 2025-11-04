'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Dynamically import components that depend on client-side state
const DashboardHeader = dynamic(() => import('./DashboardHeader').then(mod => ({ default: mod.DashboardHeader })), {
  ssr: false,
  loading: () => <div className="h-16 bg-card border-b border-border animate-pulse" />
});

const DashboardSidebar = dynamic(() => import('./DashboardSidebar').then(mod => ({ default: mod.DashboardSidebar })), {
  ssr: false,
  loading: () => <div className="w-64 bg-card border-r border-border animate-pulse" />
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();

  console.log('LayoutContent: Render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'pathname:', pathname);

  const isAuthPage = pathname.startsWith('/login');


  // Show loading state while checking authentication - this ensures server and client render the same initially
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-2xl p-8 flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth pages get full screen without header/footer
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  // Dashboard layout for authenticated users
  if (isAuthenticated) {
    console.log('LayoutContent: Rendering authenticated layout');
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col" suppressHydrationWarning>
        {/* Header */}
        <DashboardHeader />

        {/* Main content area with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Landing page layout for unauthenticated users
  console.log('LayoutContent: Rendering unauthenticated layout');
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}

export default LayoutContent;