import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader, Geist_Mono } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const serifFont = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

const monoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lisa — AI Content Distribution & Repurposing Platform",
  description: "Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.",
  openGraph: {
    title: "Lisa — AI Content Distribution & Repurposing Platform",
    description: "Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${serifFont.variable} ${monoFont.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#ede8df] font-sans selection:bg-[#ede8df]/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
