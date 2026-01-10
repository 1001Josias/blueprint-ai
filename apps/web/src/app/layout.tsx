import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getAllProjects } from "@/lib/markdown";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlueprintAI",
  description: "AI-Powered Task Management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const workspace = headersList.get("x-workspace") || undefined;
  const projects = await getAllProjects(workspace);

  return (
    <html lang="en">
      <body className={inter.className}>
        <NuqsAdapter>
          <div className="flex min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
            <Sidebar projects={projects} />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </NuqsAdapter>
      </body>
    </html>
  );
}
