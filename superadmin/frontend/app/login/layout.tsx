import { ThemeProvider } from "../../components/ThemeProvider";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}