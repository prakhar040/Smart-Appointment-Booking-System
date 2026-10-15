import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morrow Care | Book a visit",
  description: "Choose your doctor and book a convenient time for your visit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{ colorScheme: "light", backgroundColor: "#f7f8f6" }}
    >
      <body className="min-h-full flex flex-col text-gray-900">
        <Suspense fallback={<div className="h-14 border-b border-gray-200 bg-white" aria-hidden="true" />}>
          <Nav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
