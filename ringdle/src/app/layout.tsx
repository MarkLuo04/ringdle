import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Archivo_Black, Space_Grotesk } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ringdle",
  description: "Guess the boxer!",
  icons: [{ rel: "icon", url: "/ringdle.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        geist.variable,
        archivoBlack.variable,
        spaceGrotesk.variable,
        "font-sans",
        "dark",
      )}
    >
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
