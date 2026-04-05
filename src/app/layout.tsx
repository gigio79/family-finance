import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinFamily - Gestão Financeira Familiar Inteligente",
  description: "Sistema completo de gestão financeira para sua família. Controle gastos, receitas, metas e muito mais.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinFamily"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
