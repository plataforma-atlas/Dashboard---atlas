import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./webinar-os-theme.css";
import "./webinar-control-center.css";
import { ThemeModeProvider } from "@/components/ThemeModeProvider";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Control de Lanzamiento — Agencia Vermetricas",
  description: "Panel de telemetría del funnel de marketing por cliente.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-background text-on-surface antialiased`}>
        <ThemeModeProvider>{children}</ThemeModeProvider>
      </body>
    </html>
  );
}
