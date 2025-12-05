import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Swipe Budget Tracker",
  description: "Expense tracking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Header />
        {children}
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2025 Swipe Budget Tracker. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
