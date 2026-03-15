import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mama's Kitchen - Campus Food Delivery",
  description: "Order meals on campus. Breakfast, lunch, and dinner delivered.",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
