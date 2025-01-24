import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/providers/AuthProvider";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "PinkLife - Beauty. Brains. Tea.",
    template: "%s | PinkLife"
  },
  description: "A sophisticated beauty tech platform empowering women through technology, community, and wellness. Join us for beauty insights, smart skincare analysis, and global beauty wisdom.",
  keywords: ["beauty tech", "skincare", "wellness", "beauty community", "smart mirror", "skin analysis", "beauty risk assessment"],
  authors: [{ name: "PinkLife" }],
  openGraph: {
    title: "PinkLife - Beauty. Brains. Tea.",
    description: "A sophisticated beauty tech platform empowering women through technology, community, and wellness.",
    url: "https://pinklife.social",
    siteName: "PinkLife",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "PinkLife - Beauty. Brains. Tea.",
    description: "A sophisticated beauty tech platform empowering women through technology, community, and wellness."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GlobalErrorBoundary>
          <AuthProvider>
            <ThemeProvider>
              <div className="min-h-screen">
                <Navbar />
                <main className="py-8">
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="hidden lg:block lg:col-span-3">
                        <Sidebar />
                      </div>
                      <div className="lg:col-span-9">{children}</div>
                    </div>
                  </div>
                </main>
              </div>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
