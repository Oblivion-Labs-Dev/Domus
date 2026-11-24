import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domus — Family Operating Hub",
  description:
    "Lightweight household hub for overlapping schedules, time-booking, exercise & diet trackers, and shared lists with real family roles.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
