import "@/app/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CountryHome | Best E-commerce Platform",
  description: "Buy premium bedsheets, comforters, dohars, and hospital & clinic linen online at CountryHome. Trusted ecommerce platform for quality textiles, bulk orders, and affordable pricing across India.",
  icons: {
    icon: [{ url: "/logo.jpg", type: "image/jpeg" }],
    shortcut: [{ url: "/logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/logo.jpg", type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
