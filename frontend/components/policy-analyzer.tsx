"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzePolicy, comparePolicies, PolicyAnalysis, PolicyComparison } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertTriangle, FileText, Search, Loader2, Download, History, Clock, GitCompare, FileJson, Printer, CheckCircle2 } from "lucide-react";

export interface HistoryItem {
  id: string;
  source: string;
  date: string;
  transparency_score: number;
  verdict: string;
  data: PolicyAnalysis;
}

export function PolicyAnalyzer() {
  const [mode, setMode] = useState<"url" | "text" | "compare" | "history">("url");
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [compareResult, setCompareResult] = useState<PolicyComparison | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("clearterms_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const saveToHistory = (source: string, data: PolicyAnalysis) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      source,
      date: new Date().toISOString(),
      transparency_score: data.transparency_score,
      verdict: data.verdict,
      data
    };
    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem("clearterms_history", JSON.stringify(updated));
      return updated;
    });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult(item.data);
    setError("");
    if (item.source.startsWith("http")) {
       setUrl(item.source);
       setMode("url");
    } else {
       setText(item.source);
       setMode("text");
    }
  };
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
      const targetUrl = mode === "url" ? url : null;
      const targetText = mode === "text" ? text : undefined;

      const data = await analyzePolicy(targetUrl, targetText);
      setResult(data);
      saveToHistory(targetUrl || targetText || "Unknown", data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Failed to analyze policy. Please check input.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlA || !urlB) return;

    setLoading(true);
    setError("");
    setCompareResult(null);

    try {
      const data = await comparePolicies(urlA, undefined, urlB, undefined);
      setCompareResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to compare policies. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = compareResult ? compareResult : result;
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `ClearTerms_Analysis_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleExportPDF = () => {
    window.print();
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
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="w-full">
      {/* Input Section */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-5">
        {/* Tabs Container */}
        <div className="flex bg-[#161618] p-1.5 rounded-[1.25rem] border border-white/5 w-fit shadow-2xl z-10" role="tablist" aria-label="Input mode selection">
          <button
            role="tab"
            aria-selected={mode === "url"}
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
            role="tab"
            aria-selected={mode === "text"}
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
          <button
            role="tab"
            aria-selected={mode === "compare"}
            onClick={() => { setMode("compare"); setResult(null); setCompareResult(null); setError(""); }}
            className={cn(
              "px-6 py-2.5 rounded-[1rem] text-sm font-semibold transition-all duration-300 flex items-center",
              mode === "compare"
                ? "bg-[#3B82F6] text-white shadow-md block"
                : "text-gray-400 hover:text-gray-200 bg-transparent",
            )}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </button>
          <button
            role="tab"
            aria-selected={mode === "history"}
            onClick={() => { setMode("history"); setResult(null); setCompareResult(null); setError(""); }}
            className={cn(
              "px-6 py-2.5 rounded-[1rem] text-sm font-semibold transition-all duration-300 flex items-center",
              mode === "history"
                ? "bg-[#3B82F6] text-white shadow-md block"
                : "text-gray-400 hover:text-gray-200 bg-transparent",
            )}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </button>
        </div>

        {mode === "compare" ? (
          <form onSubmit={handleCompare} className="relative w-full z-10 mt-6 space-y-4">
            <div className="relative group w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative flex items-center bg-[#19152b] rounded-[1.25rem] border border-white/5 p-1.5 shadow-2xl">
                <input
                  type="url"
                  placeholder="Policy A URL (e.g. Terms 2023)"
                  value={urlA}
                  onChange={(e) => setUrlA(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-gray-300 placeholder-gray-500 px-4 py-3 text-[14px] font-medium"
                  required
                />
              </div>
              <div className="relative flex items-center bg-[#19152b] rounded-[1.25rem] border border-white/5 p-1.5 shadow-2xl">
                <input
                  type="url"
                  placeholder="Policy B URL (e.g. Terms 2024)"
                  value={urlB}
                  onChange={(e) => setUrlB(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-gray-300 placeholder-gray-500 px-4 py-3 text-[14px] font-medium"
                  required
                />
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <GitCompare className="w-5 h-5 mr-2" />
                )}
                Compare Policies
              </button>
            </div>
          </form>
        ) : mode !== "history" ? (
        <form onSubmit={handleAnalyze} className="relative w-full z-10 mt-6">
          {/* Input Container with Custom Glow and Background */}
          <div className="relative group w-full">
            {/* Outer Glow perfectly matching the reference */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2157a8]/50 via-[#45278b]/60 to-[#27104b]/50 rounded-[1.25rem] blur-xl opacity-100 transition duration-500"></div>

            {mode === "url" ? (
              <div className="relative flex items-center bg-[#19152b] rounded-[1.25rem] border border-white/5 p-1.5 shadow-2xl transition-all duration-300">
                <input
                  id="url-input"
                  aria-label="Privacy Policy URL"
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
                  aria-label="Analyze URL"
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
                  id="text-input"
                  aria-label="Privacy Policy Text"
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
        ) : (
          <div className="w-full z-10 mt-6 space-y-4">
            {history.length === 0 ? (
              <div className="glass-card p-8 text-center text-gray-400 italic">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                No analysis history yet. Analyze a URL or text to save it here.
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => loadFromHistory(item)}
                  className="glass-card p-4 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex flex-col overflow-hidden mr-4">
                    <span className="text-white font-semibold truncate w-full max-w-sm">{item.source}</span>
                    <span className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide",
                      item.verdict === "Safe" ? "bg-green-500/20 text-green-400" :
                      item.verdict === "Caution" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>{item.verdict}</span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-white/5 border border-white/10 group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-transparent transition-all">
                      {item.transparency_score}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportMarkdown}
                      title="Export Markdown"
                      className="flex items-center text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all duration-300"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      MD
                    </button>
                    <button
                      onClick={handleExportJSON}
                      title="Export JSON"
                      className="flex items-center text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all duration-300"
                    >
                      <FileJson className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                      JSON
                    </button>
                    <button
                      onClick={handleExportPDF}
                      title="Print / Export PDF"
                      className="flex items-center text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all duration-300"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                      PDF
                    </button>
                  </div>
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

      {/* Compare Results View */}
      <AnimatePresence>
        {compareResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mt-8"
          >
            {/* Header & Export */}
            <div className="flex justify-between items-center glass-card p-6">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <GitCompare className="w-6 h-6 mr-2 text-blue-400" />
                  Policy Comparison Verdict
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Winner: <span className="font-bold text-green-400">{compareResult.winner}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
                >
                  <FileJson className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  Export JSON
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                  Print / PDF
                </button>
              </div>
            </div>

            {/* Side-by-Side Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy A Card */}
              <div className="glass-card p-6 border-t-4 border-t-blue-500">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Policy A</div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-4xl font-extrabold text-white">{compareResult.policy_a_score}<span className="text-xs text-gray-500 font-normal">/100</span></span>
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full uppercase",
                    compareResult.policy_a_verdict === "Safe" ? "bg-green-500/20 text-green-400" :
                    compareResult.policy_a_verdict === "Caution" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {compareResult.policy_a_verdict}
                  </span>
                </div>
              </div>

              {/* Policy B Card */}
              <div className="glass-card p-6 border-t-4 border-t-purple-500">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Policy B</div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-4xl font-extrabold text-white">{compareResult.policy_b_score}<span className="text-xs text-gray-500 font-normal">/100</span></span>
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full uppercase",
                    compareResult.policy_b_verdict === "Safe" ? "bg-green-500/20 text-green-400" :
                    compareResult.policy_b_verdict === "Caution" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {compareResult.policy_b_verdict}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-6">
              <h4 className="text-lg font-bold text-white mb-2">Comparative Summary</h4>
              <p className="text-gray-300 leading-relaxed">{compareResult.summary}</p>
            </div>

            {/* Key Differences */}
            <div className="glass-card p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-blue-400" />
                Key Differences Breakdown
              </h4>
              <div className="space-y-3">
                {compareResult.key_differences.map((diff, idx) => (
                  <div key={idx} className="flex items-start bg-white/5 p-3.5 rounded-xl border border-white/5 text-sm text-gray-300">
                    <span className="font-bold text-blue-400 mr-3">{idx + 1}.</span>
                    <span>{diff}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
