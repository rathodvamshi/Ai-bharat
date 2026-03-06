import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Jan-Sahayak | जन-सहायक",
  description: "Janashayak: Your AI-powered personal assistant for Indian farmers. Get weather updates, crop advice, government schemes, and voice assistance in your village language.",
  keywords: ["Janashayak", "Jan-Sahayak", "जन-सहायक", "farmer app", "government schemes", "crop advice", "PM-KISAN", "weather", "India"],
  authors: [{ name: "Jan-Sahayak Team" }],
  creator: "Jan-Sahayak",
  robots: "index, follow",
  openGraph: {
    title: "Jan-Sahayak | जन-सहायक",
    description: "Your AI-powered farming companion",
    type: "website",
    locale: "hi_IN",
    siteName: "Jan-Sahayak",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2E7D32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className={poppins.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="google" content="notranslate" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="किसान AI" />
      </head>
      <body className="antialiased hide-scrollbar" style={{ fontFamily: "'Poppins', sans-serif" }} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
