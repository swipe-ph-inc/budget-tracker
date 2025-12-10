import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Swipe Budget Tracker",
  description: "Expense tracking app",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/Emblem-white.svg" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />

          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>2025 Swipe Budget Tracker. All rights reserved.</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
