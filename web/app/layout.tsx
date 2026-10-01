import type { Metadata } from "next";
import { Fraunces, DM_Mono, Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import "./globals.css";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"], axes: ["opsz"] });
const grotesk = Bricolage_Grotesque({ variable: "--font-grotesk", subsets: ["latin"], axes: ["opsz", "wdth"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const mono = DM_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Hack for SDG",
  description: "Hack for SDG, the Global Goals Hackathon: pitch a solution to a real-world problem tied to the UN Sustainable Development Goals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${grotesk.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
