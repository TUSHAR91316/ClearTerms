import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ClearTerms - Free Privacy Policy Analyzer & AI Legal Summarizer",
    description: "Analyze privacy policies and Terms of Service instantly with AI. Identify risks, summarize rights, and get a transparency score. GDPR & CCPA ready.",
    keywords: ["privacy policy checker", "terms of service summary", "AI legal assistant", "GDPR checker", "contract scanner"],
    openGraph: {
        title: "ClearTerms - Free Privacy Policy Analyzer",
        description: "Don't agree blindly. Use AI to scan agreements for risks and hidden clauses.",
        type: "website",
    }
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ClearTerms",
    "applicationCategory": "LegalApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "description": "AI agent that analyzes privacy policies and terms of service for risks."
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
