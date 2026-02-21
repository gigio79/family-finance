import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinFamily - Gestão Financeira Familiar Inteligente",
  description: "Sistema completo de gestão financeira para sua família. Controle gastos, receitas, metas e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
