import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SWRegister from "@/app/components/SWRegister"; // 👈 importamos
import EnablePush from "@/app/components/EnablePush";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Peña",
  description: "Organizá tus asados con recordatorios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0b1220" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EnablePush />
        <SWRegister /> {/* 👈 registra el service worker */}
        {children}
      </body>
    </html>
  );
}
