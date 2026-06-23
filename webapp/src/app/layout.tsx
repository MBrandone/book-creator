import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/app/query-provider";
import {Header} from "@/components/header";
import {Footer} from "@/components/footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Book Creator - Créez des Histoires Personnalisées",
  description: "Créez des livres illustrés personnalisés avec l'IA. Transformez vos proches en héros d'histoires inoubliables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <QueryProvider>
          <Header/>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer/>
        </QueryProvider>
      </body>
    </html>
  );
}
