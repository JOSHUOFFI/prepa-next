import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
export const metadata: Metadata = { title: { default: "PrePa CBT Portal", template: "%s | PrePa" }, description: "Secure online exams, timed CBT practice, and instant performance tracking.", icons: { icon: "/favicon.png" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#a41849" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><SiteHeader />{children}<SiteFooter /></body></html>; }
