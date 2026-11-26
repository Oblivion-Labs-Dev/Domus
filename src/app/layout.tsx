import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domus — Your Family's Digital House",
  description:
    "One calm, flexible digital space to organize life at home — shared when you want, private when you need.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
