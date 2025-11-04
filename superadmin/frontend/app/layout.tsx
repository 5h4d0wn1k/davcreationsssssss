import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { AuthProvider } from "../components/AuthProvider";
import { GlobalLoadingProvider } from "../components/GlobalLoadingProvider";
import { NetworkStatusProvider } from "../components/NetworkStatusProvider";
import { RateLimitHandler } from "../components/RateLimitHandler";
import { ErrorBoundary } from "../components/ErrorBoundary";
import LayoutContent from "../components/LayoutContent";
import { ToastProvider } from "../components/Toast";
import { SecurityInit } from "../components/SecurityInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuperAdmin Dashboard - DAV Creations",
  description: "SuperAdmin management system by DAV Creations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <SecurityInit />
            <NetworkStatusProvider>
              <GlobalLoadingProvider>
                <RateLimitHandler>
                  <AuthProvider>
                    <ThemeProvider>
                      <LayoutContent>{children}</LayoutContent>
                    </ThemeProvider>
                  </AuthProvider>
                </RateLimitHandler>
              </GlobalLoadingProvider>
            </NetworkStatusProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
