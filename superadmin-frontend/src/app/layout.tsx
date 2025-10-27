import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <GlobalErrorBoundary>
          <ThemeProvider>
            <AuthErrorBoundary>
              <AuthProvider>
                <SidebarProvider>
                  {children}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: '#10B981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: {
                          primary: '#EF4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </SidebarProvider>
              </AuthProvider>
            </AuthErrorBoundary>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
