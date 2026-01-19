"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzePolicy, PolicyAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, FileText, Search, Loader2 } from "lucide-react";

export default function Home() {
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
            // Pass both, let api/backend helper decide based on what's present or add logic here
            // Our API client signature is (url, text?), but we should just pass empty string for url if text mode
            const targetUrl = mode === "url" ? url : "";
            const targetText = mode === "text" ? text : undefined;

            const data = await analyzePolicy(targetUrl, targetText);
            setResult(data);
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to analyze policy. Please check input.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-8"
            >
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 backdrop-blur-md">
                        <ShieldCheck className="w-8 h-8 text-blue-400 mr-2" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            ClearTerms
                        </span>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
                        Decode Privacy Policies
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">
                        Analyze any Privacy Policy or Terms of Service instantly.
                    </p>
                </div>

                {/* Input Section */}
                <div className="w-full max-w-xl mx-auto space-y-4">

                    {/* Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit mx-auto backdrop-blur-md">
                        <button
                            onClick={() => setMode("url")}
                            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === "url" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Analyze URL
                        </button>
                        <button
                            onClick={() => setMode("text")}
                            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === "text" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Paste Text
                        </button>
                    </div>

                    <form onSubmit={handleAnalyze} className="relative w-full">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>

                            {mode === "url" ? (
                                <div className="relative flex items-center bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-2">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/privacy-policy"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    </button>
                                </div>
                            ) : (
                                <div className="relative bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-2 flex flex-col">
                                    <textarea
                                        placeholder="Paste the policy text here..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3 min-h-[150px] resize-none focus:ring-0"
                                        required
                                    />
                                    <div className="flex justify-end p-2 border-t border-white/5">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
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
                            className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-center"
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
                            className="space-y-6"
                        >
                            {/* Score & Verdict */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-card p-6 flex flex-col items-center justify-center text-center col-span-1">
                                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Transparency Score</div>
                                    <div className={cn(
                                        "text-6xl font-bold mb-2",
                                        result.transparency_score > 80 ? "text-green-400" :
                                            result.transparency_score > 50 ? "text-yellow-400" : "text-red-400"
                                    )}>
                                        {result.transparency_score}
                                    </div>
                                    <div className="text-sm text-gray-400">out of 100</div>
                                </div>

                                <div className="glass-card p-6 col-span-2 flex flex-col justify-center">
                                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Verdict & Summary</div>
                                    <h3 className={cn(
                                        "text-2xl font-bold mb-3",
                                        result.verdict === 'Safe' ? "text-green-400" :
                                            result.verdict === 'Caution' ? "text-yellow-400" : "text-red-400"
                                    )}>
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
                                        <div className="glass-card p-4 text-gray-400 italic">No major risks detected.</div>
                                    ) : (
                                        result.risk_flags.map((risk, idx) => (
                                            <div key={idx} className="glass-card p-4 border-l-4 border-l-red-500/50">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-red-200">{risk.category}</span>
                                                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{risk.severity}</span>
                                                </div>
                                                <p className="text-sm text-gray-400">{risk.description}</p>
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
                                        <div className="glass-card p-4 text-gray-400 italic">No specific rights mentioned.</div>
                                    ) : (
                                        result.user_rights.map((right, idx) => (
                                            <div key={idx} className="glass-card p-4 border-l-4 border-l-green-500/50">
                                                <div className="font-bold text-green-200 mb-1">{right.right}</div>
                                                <p className="text-sm text-gray-400">{right.details}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </main>
    );
}
