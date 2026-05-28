"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzePolicy, PolicyAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertTriangle, FileText, Search, Loader2, Download } from "lucide-react";

export function PolicyAnalyzer() {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyAnalysis | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "url" && !url) return;
    if (mode === "text" && !text) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const targetUrl = mode === "url" ? url : "";
      const targetText = mode === "text" ? text : undefined;

      const data = await analyzePolicy(targetUrl, targetText);
      setResult(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Failed to analyze policy. Please check input.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    
    const source = mode === "url" ? url : "Pasted policy text";
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const mdContent = `# ClearTerms Policy Analysis Report

**Analysis Date:** ${dateStr}
**Source Analyzed:** ${source}
**Verdict:** ${result.verdict}
**Transparency Score:** ${result.transparency_score}/100

---

## 1. Executive Summary
${result.summary}

---

## 2. Red Flags & Identified Risks
${
  result.risk_flags.length === 0
    ? "*No significant predatory clauses or red flags were identified in this policy.*"
    : result.risk_flags
        .map(
          (risk, idx) =>
            `### ${idx + 1}. [${risk.severity}] ${risk.category}\n* ${risk.description}`
        )
        .join("\n\n")
}

---

## 3. User Rights & Exercisability
${
  result.user_rights.length === 0
    ? "*No explicit statements regarding data subject rights or exercisability methods were identified.*"
    : result.user_rights
        .map(
          (right, idx) =>
            `### ${idx + 1}. ${right.right}\n* **Details:** ${right.details}`
        )
        .join("\n\n")
}

---
*Report compiled automatically by the ClearTerms Legal Expert AI Engine. This analysis is for educational purposes only and does not constitute formal legal advice.*
`;

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `ClearTerms_Analysis_Report_${new Date().toISOString().split("T")[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {/* Input Section */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-5">
        {/* Tabs Container */}
        <div className="flex bg-[#161618] p-1.5 rounded-[1.25rem] border border-white/5 w-fit shadow-2xl z-10">
          <button
            onClick={() => setMode("url")}
            className={cn(
              "px-6 py-2.5 rounded-[1rem] text-sm font-semibold transition-all duration-300",
              mode === "url"
                ? "bg-[#3B82F6] text-white shadow-md block"
                : "text-gray-400 hover:text-gray-200 bg-transparent",
            )}
          >
            Analyze URL
          </button>
          <button
            onClick={() => setMode("text")}
            className={cn(
              "px-6 py-2.5 rounded-[1rem] text-sm font-semibold transition-all duration-300",
              mode === "text"
                ? "bg-[#3B82F6] text-white shadow-md block"
                : "text-gray-400 hover:text-gray-200 bg-transparent",
            )}
          >
            Paste Text
          </button>
        </div>

        <form onSubmit={handleAnalyze} className="relative w-full z-10 mt-6">
          {/* Input Container with Custom Glow and Background */}
          <div className="relative group w-full">
            {/* Outer Glow perfectly matching the reference */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2157a8]/50 via-[#45278b]/60 to-[#27104b]/50 rounded-[1.25rem] blur-xl opacity-100 transition duration-500"></div>

            {mode === "url" ? (
              <div className="relative flex items-center bg-[#19152b] rounded-[1.25rem] border border-white/5 p-1.5 shadow-2xl transition-all duration-300">
                <input
                  type="url"
                  placeholder="https://example.com/privacy-policy"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-gray-300 placeholder-gray-500 px-6 py-3.5 text-[15px] font-medium tracking-wide"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 flex-shrink-0 mr-1"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col bg-[#19152b] rounded-[1.25rem] border border-white/5 p-2 shadow-2xl transition-all duration-300">
                <textarea
                  placeholder="Paste the policy text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-gray-300 placeholder-gray-500 px-6 py-4 min-h-[160px] text-[15px] font-medium tracking-wide resize-none focus:ring-0"
                  required
                />
                <div className="flex justify-end p-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#3B82F6] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Analyze Text
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-center mt-6"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mt-8"
          >
            {/* Score & Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center col-span-1">
                <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">
                  Transparency Score
                </div>
                <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                  {/* Outer glow matching the reference perfectly */}
                  <div className={cn(
                    "absolute inset-2 rounded-full blur-xl opacity-20 transition duration-500",
                    result.transparency_score > 80
                      ? "bg-green-500"
                      : result.transparency_score > 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  )}></div>

                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Track Circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="38"
                      className="stroke-white/10"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    {/* Foreground Animated Score Circle */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="38"
                      className={cn(
                        "transition-all duration-1000 ease-out",
                        result.transparency_score > 80
                          ? "stroke-green-400"
                          : result.transparency_score > 50
                            ? "stroke-yellow-400"
                            : "stroke-red-400"
                      )}
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 38}
                      initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 38) - (result.transparency_score / 100) * (2 * Math.PI * 38) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {result.transparency_score}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 col-span-2 flex flex-col justify-center relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                    Verdict & Summary
                  </div>
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all duration-300"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Export Report
                  </button>
                </div>
                <h3
                  className={cn(
                    "text-2xl font-bold mb-3",
                    result.verdict === "Safe"
                      ? "text-green-400"
                      : result.verdict === "Caution"
                        ? "text-yellow-400"
                        : "text-red-400",
                  )}
                >
                  {result.verdict}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Red Flags and Rights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risks */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  Potential Risks
                </h3>
                {result.risk_flags.length === 0 ? (
                  <div className="glass-card p-4 text-gray-400 italic">
                    No major risks detected.
                  </div>
                ) : (
                  result.risk_flags.map((risk, idx) => (
                    <div
                      key={idx}
                      className="glass-card p-4 border-l-4 border-l-red-500/50"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-red-200">
                          {risk.category}
                        </span>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {risk.description}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Rights */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-400" />
                  Your Rights
                </h3>
                {result.user_rights.length === 0 ? (
                  <div className="glass-card p-4 text-gray-400 italic">
                    No specific rights mentioned.
                  </div>
                ) : (
                  result.user_rights.map((right, idx) => (
                    <div
                      key={idx}
                      className="glass-card p-4 border-l-4 border-l-green-500/50"
                    >
                      <div className="font-bold text-green-200 mb-1">
                        {right.right}
                      </div>
                      <p className="text-sm text-gray-400">{right.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
