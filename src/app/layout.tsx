import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientComponent from "@/components/client-init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tricycle CRM",
  description: "CRM para gestión de negocios, proveedores, clientes y logística",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ClientComponent />
        {children}
      </body>
    </html>
  );
} 