import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getAllProjects } from "@/lib/markdown";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlueprintAI - AI-Powered Task Management",
  description: "Transform AI-generated PRDs into beautiful, trackable tasks",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projects = await getAllProjects();

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <Sidebar projects={projects} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
