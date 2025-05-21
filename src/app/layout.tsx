import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// Les métadonnées doivent être dans un composant serveur
export const metadata: Metadata = {
  title: "Cikatio - Gestion de Prêts de Livres et Matériel",
  description: "Application de gestion de prêts de livres et de matériel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
