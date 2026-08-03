import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackWidget } from "@/components/FeedbackWidget";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Careersume: the resume, rewritten for the job",
  description:
    "Free, open-source AI resume tailoring. Paste a job description, connect your own AI key, and get an ATS-safe resume built for that exact job. Unlimited use, your data stays yours.",
  keywords: ["Careersume", "open source resume builder", "AI resume tailoring", "ATS optimization", "BYOK", "job application"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
