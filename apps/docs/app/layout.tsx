import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Transmute Documentation",
    template: "%s | Transmute",
  },
  description:
    "Intelligent Task Management System designed for AI Agents and Humans. Bridge the gap between AI-generated workflows and enterprise execution.",
  keywords: [
    "task management",
    "ai agents",
    "automation",
    "project management",
    "prd",
    "transmute",
    "jira integration",
    "linear integration",
  ],
  authors: [{ name: "Transmute Team" }],
  creator: "Transmute",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Transmute Documentation",
    title: "Transmute Documentation",
    description:
      "Intelligent Task Management System designed for AI Agents and Humans.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transmute Documentation",
    description:
      "Intelligent Task Management System designed for AI Agents and Humans.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
