// app/layout.tsx
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400","600","700"], display: "swap" });

export const metadata = { title: "DouConMonLis｜道コン問リス" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} min-h-dvh bg-gradient-to-b from-[var(--bg-grad-from)] to-[var(--bg-grad-to)] text-neutral-900`}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </body>
    </html>
  );
}
