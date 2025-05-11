import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SharedStateProvider } from "@/context/AppContext"; // 경로 수정 가능성 있음

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tariff Information", // 예시 타이틀
  description: "Interactive tariff information and news",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* charset and viewport are often handled by Next.js automatically,
            but can be added here if specific overrides are needed. */}
        {/* <meta charSet="UTF-8" /> */}
        {/* <meta name="viewport" content="width=device-width, initial-scale=1.0" /> */}
      </head>
      <body className={inter.className}>
        <SharedStateProvider>
          {children}
        </SharedStateProvider>
      </body>
    </html>
  );
}
