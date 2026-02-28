import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "AwaazTwin - Voice Cloning Portal",
  description: "AI-powered voice cloning and text-to-speech portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 bg-white">{children}</main>
        </div>
      </body>
    </html>
  );
}
