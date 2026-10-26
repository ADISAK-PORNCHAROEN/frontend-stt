import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import "./tailwind.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["latin", "thai"],
});

export const metadata: Metadata = {
  title: "Time Atlas — เว็บถอดเสียงจากไฟล์เสียงและวิดีโอ",
  description: "ถอดเสียงจากไฟล์ในเครื่อง พร้อมฟังและเลือกเล่นตามช่วงเวลาได้",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} h-full bg-canvas font-sans text-ink scheme-light antialiased selection:bg-accent selection:text-white motion-reduce:scroll-auto`}
    >
      <body className="min-h-dvh flex flex-col bg-canvas font-sans text-base leading-[1.55] text-ink">{children}</body>
    </html>
  );
}
