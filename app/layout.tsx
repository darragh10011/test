import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/lib/use-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Scheduling | StoryKeeper",
  description: "Schedule life-story interviews with authors"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
            <header className="border-b bg-white">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div>
                  <p className="text-lg font-semibold">StoryKeeper</p>
                  <p className="text-sm text-muted-foreground">
                    Interview Scheduling
                  </p>
                </div>
                <nav className="flex gap-4 text-sm text-muted-foreground">
                  <a href="/" className="hover:text-foreground">
                    Book
                  </a>
                  <a href="/author/settings" className="hover:text-foreground">
                    Author Settings
                  </a>
                  <a
                    href="/admin/appointments"
                    className="hover:text-foreground"
                  >
                    Admin
                  </a>
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
          </div>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
