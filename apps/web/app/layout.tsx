import type { Metadata } from "next";

import "./globals.css";

import { TrustProvider } from "@/contexts/TrustContext";
import { MissionProvider } from "@/contexts/MissionContext";

export const metadata: Metadata = {
  title: "ComplianceOS",
  description: "AI-Powered Digital Trust Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-white text-slate-900">

        <MissionProvider>

          <TrustProvider>

            {children}

          </TrustProvider>

        </MissionProvider>

      </body>
    </html>
  );
}
