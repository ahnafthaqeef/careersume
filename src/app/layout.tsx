import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackWidget } from "@/components/FeedbackWidget";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Careersume: the resume, rewritten for the job",
  description:
    "Free, open-source AI resume tailoring. Paste a job description, connect your own AI key, and get an ATS-safe resume built for that exact job. Unlimited use, your data stays yours.",
  keywords: ["Careersume", "open source resume builder", "AI resume tailoring", "ATS optimization", "BYOK", "job application"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ground text-ink font-sans antialiased">
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
