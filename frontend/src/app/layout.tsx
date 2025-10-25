import "@/styles/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-provider";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Foot Traffic Finder",
  description: "Live and predicted foot traffic for better food truck spots"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased font-sans", inter.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}


