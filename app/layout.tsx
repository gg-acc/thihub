import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import TripleWhalePixel from "@/components/TripleWhalePixel";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Top Health Insider - Breaking News",
  description: "Investigative health reports and breaking news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${merriweather.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <TripleWhalePixel />
        {children}
      </body>
    </html>
  );
}
