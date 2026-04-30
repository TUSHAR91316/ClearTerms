import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://clear-terms.vercel.app"),
  title: {
    default: "ClearTerms - Free Privacy Policy Analyzer & AI Legal Summarizer",
    template: "%s | ClearTerms",
  },
  description:
    "Analyze privacy policies and Terms of Service instantly with AI. Identify risks, summarize rights, and get a transparency score. GDPR & CCPA ready.",
  keywords: [
    "privacy policy checker",
    "terms of service summary",
    "AI legal assistant",
    "GDPR checker",
    "contract scanner",
  ],
  authors: [{ name: "ClearTerms" }],
  creator: "ClearTerms",
  openGraph: {
    title: "ClearTerms - Free Privacy Policy Analyzer",
    description:
      "Don't agree blindly. Use AI to scan agreements for risks and hidden clauses.",
    url: "https://clear-terms.vercel.app",
    siteName: "ClearTerms",
    images: [
      {
        url: "/demo.png",
        width: 1200,
        height: 630,
        alt: "ClearTerms UI Demo - Analyzing Privacy Policies with AI",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClearTerms - Analyze Privacy Policies with AI",
    description:
      "AI agent that analyzes privacy policies and terms of service for risks. Free and instant.",
    images: ["/demo.png"],
  },
  alternates: {
    canonical: "https://clear-terms.vercel.app",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClearTerms",
  applicationCategory: "LegalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "AI agent that analyzes privacy policies and terms of service for risks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
