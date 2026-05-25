import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "African Language STT",
  description: "Speech-to-Text for African Languages — 6 model comparison",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
