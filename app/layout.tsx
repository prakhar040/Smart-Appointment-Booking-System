import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Appointment Booking",
  description: "Choose a provider and book an appointment online.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light", backgroundColor: "#f7f8f6" }}
    >
      <body className="min-h-full flex flex-col bg-[#f7f8f6] text-gray-900">
        <Suspense fallback={<div className="h-14 border-b border-gray-200 bg-white" aria-hidden="true" />}>
          <Nav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
