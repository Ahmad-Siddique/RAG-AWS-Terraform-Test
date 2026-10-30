import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter } from "@/components/AppFooter";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AskMyDocs",
  description: "Chat with your documents",
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: LayoutProps<"/">) {
  if (!publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Copy keys from Clerk dashboard into frontend/.env.local and restart npm run dev.",
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
          <Suspense
            fallback={
              <header className="h-14 border-b border-slate-800/80 bg-slate-950" />
            }
          >
            <Header />
          </Suspense>
          <div className="flex flex-1 flex-col">{children}</div>
          <AppFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
