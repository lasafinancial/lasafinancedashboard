import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { PlayCircle, PauseCircle, ChevronLeft, ChevronRight, Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface FrameData {
    Time: string;
    "Nifty Price": number | string;
    "1-Min Trend": string;
    "Call Action": string;
    "Put Action": string;
    "5-Min Trend": string;
    "5-Min Execution Summary": string;
    "Key Strike": string;
    "Raw JSON Data": string;
    // Parsed options chain from JSON
    parsedOptions?: any;
}


const formatBigNumber = (num: number) => {
    if (!num) return "-";
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export default function NiftyAnalysis() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const activeItemRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll the timeline to the active frame
    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentFrameIndex]);

    // Fetch data
    const { data: frames, isLoading, isError } = useQuery({
        queryKey: ['niftyOptix'],
        queryFn: async () => {
            const res = await fetch('/api/nifty-options-data');
            if (!res.ok) throw new Error('Network response was not ok');
            const json = await res.json();

            // Keep ALL rows that have a valid Time (for the 5-Min Timeline)
            // parsedOptions may be null for some rows — OI Battlefield handles that gracefully
            return json
                .filter((row: any) => row.Time)
                .map((row: any) => {
                    let parsedOptions = null;
                    try {
                        if (row["Raw JSON Data"] && row["Raw JSON Data"] !== "API Error") {
                            parsedOptions = JSON.parse(row["Raw JSON Data"]);
                        }
                    } catch (e) {
                        console.error("Failed to parse options JSON for row:", row.Time);
                    }
                    return { ...row, parsedOptions };
                });
        },
        refetchInterval: 900000 // Refetch every 15 mins
    });

    // Default to the latest live frame on initial load
    useEffect(() => {
        if (frames && frames.length > 0 && !hasInitialized) {
            setCurrentFrameIndex(frames.length - 1);
            setHasInitialized(true);
        }
    }, [frames, hasInitialized]);

    const activeFrame: FrameData | null = frames?.[currentFrameIndex] || null;

    // Options Chain Prep
    const optionsChain = activeFrame?.parsedOptions?.options_chain || [];
    let totalCeOi = 0;
    let totalPeOi = 0;
    let maxVol = 1;
    optionsChain.forEach((opt: any) => {
        totalCeOi += (opt.CE_OI || 0);
        totalPeOi += (opt.PE_OI || 0);
        maxVol = Math.max(maxVol, opt.CE_Vol || 0, opt.PE_Vol || 0);
    });
    const pcr = totalCeOi > 0 ? (totalPeOi / totalCeOi) : 0;
    const pcrBiasText = pcr > 1.2 ? 'BULLISH BIAS' : pcr < 0.8 ? 'BEARISH BIAS' : 'NEUTRAL BIAS';

    const spotPrice = parseFloat(activeFrame?.["Nifty Price"]?.toString().replace(/,/g, '') || "0");
    const atmStrike = spotPrice > 0 ? Math.round(spotPrice / 50) * 50 : 0;

    // Session change from first frame to current
    const firstFramePrice = parseFloat(frames?.[0]?.["Nifty Price"]?.toString().replace(/,/g, '') || "0");
    const sessionChange = firstFramePrice > 0 ? spotPrice - firstFramePrice : 0;
    const sessionChangePct = firstFramePrice > 0 ? (sessionChange / firstFramePrice) * 100 : 0;

    // Chart config — price trajectory across all frames
    const chartPrices = (frames || []).map((f: any) => parseFloat(f["Nifty Price"]?.toString().replace(/,/g, '') || "0"));
    const validPrices = chartPrices.filter((p: number) => p > 0);
    const chartMin = validPrices.length ? Math.min(...validPrices) : 0;
    const chartMax = validPrices.length ? Math.max(...validPrices) : 1;
    const chartRange = (chartMax - chartMin) || 1;
    const CW = 600, CH = 80;
    const CP = { t: 6, r: 10, b: 22, l: 6 };
    const iW = CW - CP.l - CP.r;
    const iH = CH - CP.t - CP.b;
    const gX = (i: number) => CP.l + (frames.length > 1 ? (i / (frames.length - 1)) : 0.5) * iW;
    const gY = (p: number) => CP.t + (1 - ((p - chartMin) / chartRange)) * iH;
    const getTimeLabel = (t: string) => {
        if (!t) return '';
        const parts = t.trim().split(' ');
        if (parts.length >= 3) return `${parts[1]} ${parts[2]}`;
        return t;
    };

    // Playback Logic
    useEffect(() => {
        let interval: any;
        if (isPlaying && frames && currentFrameIndex < frames.length - 1) {
            interval = setInterval(() => {
                setCurrentFrameIndex(prev => prev + 1);
            }, 2000); // 2 seconds per frame
        } else if (currentFrameIndex >= (frames?.length || 0) - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, frames, currentFrameIndex]);

    if (isLoading) return <div className="p-8 text-center text-primary animate-pulse font-mono tracking-widest uppercase">Initializing NIFTY • OPTIX engine...</div>;
    if (isError || !frames || frames.length === 0) return <div className="p-8 text-center text-red-500 font-mono">Failed to load NiftyAnalysis.xlsx data or file is empty.</div>;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentFrameIndex(parseInt(e.target.value));
        setIsPlaying(false);
    };

    return (
        <div className="min-h-screen bg-[#0A0E17] text-slate-300 font-sans p-2 sm:p-4 pb-24">

            {/* HEADER SECTION — compact horizontal banner */}
            <div className="mb-4 bg-[#090d14] border border-white/[0.06] rounded-xl overflow-hidden">

                {/* Top thin row: title + badges */}
                <div className="flex items-center gap-3 px-4 pt-2 pb-1 border-b border-white/[0.04] flex-wrap">
                    <span className="text-primary font-bold text-[11px] font-mono tracking-widest">NIFTY • OPTIX</span>
                    <span className="text-slate-600 text-[10px] font-mono hidden sm:inline">{activeFrame?.Time}</span>
                    <span className="text-slate-700 text-[10px] font-mono hidden sm:inline">5-MIN SESSION · NSE</span>
                    <div className="flex gap-1.5 flex-wrap ml-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${activeFrame?.["1-Min Trend"]?.includes("BULLISH")
                                ? "text-green-400 bg-green-500/10 border-green-500/30"
                                : "text-red-400 bg-red-500/10 border-red-500/30"
                            }`}>1-MIN: {activeFrame?.["1-Min Trend"] || "---"}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-orange-500/30 text-orange-400 bg-orange-400/10">
                            PCR {pcr > 0 ? pcr.toFixed(2) : '--'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-white/10 text-slate-300 bg-white/5">
                            KEY STRIKE {(!activeFrame?.["Key Strike"] || activeFrame?.["Key Strike"] === "API Error") ? "---" : activeFrame?.["Key Strike"]}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sessionChange >= 0
                                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                                : 'text-red-400 bg-red-500/10 border-red-500/20'
                            }`}>SESSION {sessionChange >= 0 ? '+' : ''}{sessionChangePct.toFixed(2)}%</span>
                    </div>
                </div>

                {/* Main section — responsive: mobile=[price+cards]/[chart], desktop=[price|chart|cards] */}
                <div className="flex flex-wrap sm:flex-nowrap items-stretch">

                    {/* Price block: 45% on mobile, fixed 175px on desktop (order-1) */}
                    <div className="w-[45%] sm:w-[175px] sm:shrink-0 sm:order-1 flex flex-col justify-center px-3 sm:px-4 py-3 border-r border-white/[0.05]">
                        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-0.5">NIFTY 50</p>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
                            {activeFrame?.["Nifty Price"]?.toLocaleString() || "---"}
                        </h1>
                        <div className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 font-mono ${sessionChange >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {sessionChange >= 0 ? '▲' : '▼'} {Math.abs(sessionChange).toFixed(2)} ({sessionChange >= 0 ? '+' : ''}{sessionChangePct.toFixed(2)}%)
                        </div>
                    </div>

                    {/* Chart — full width on mobile (wraps below), flex-1 in middle on desktop via sm:order-2 */}
                    <div className="w-full sm:w-auto sm:flex-1 sm:order-2 min-w-0 relative py-1 border-t sm:border-t-0 border-white/[0.04]">
                        <svg
                            viewBox={`0 0 ${CW} ${CH}`}
                            className="w-full h-full"
                            preserveAspectRatio="none"
                            style={{ display: 'block', height: '90px' }}
                        >
                            {/* Subtle midline */}
                            <line x1={CP.l} y1={CP.t + iH / 2} x2={CW - CP.r} y2={CP.t + iH / 2}
                                stroke="#1a2535" strokeWidth="0.5" strokeDasharray="4 4" />

                            {/* Colored line segments */}
                            {frames.slice(1).map((_: any, idx: number) => {
                                const p0 = chartPrices[idx];
                                const p1 = chartPrices[idx + 1];
                                if (!p0 || !p1) return null;
                                const isFuture = idx >= currentFrameIndex;
                                const isUp = p1 >= p0;
                                return (
                                    <line
                                        key={idx}
                                        x1={gX(idx)} y1={gY(p0)}
                                        x2={gX(idx + 1)} y2={gY(p1)}
                                        stroke={isFuture ? '#1c2f1c' : isUp ? '#22c55e' : '#f43f5e'}
                                        strokeWidth={isFuture ? 1.2 : 2}
                                        strokeOpacity={isFuture ? 0.7 : 1}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                );
                            })}

                            {/* Small dots at sampled past frames */}
                            {frames.map((_: any, i: number) => {
                                const step = Math.max(1, Math.floor(frames.length / 10));
                                if (i % step !== 0 || i >= currentFrameIndex || !chartPrices[i]) return null;
                                const isUp = i > 0 ? chartPrices[i] >= chartPrices[i - 1] : true;
                                return (
                                    <circle key={i} cx={gX(i)} cy={gY(chartPrices[i])} r={2.5}
                                        fill={isUp ? '#22c55e' : '#f43f5e'} fillOpacity={0.9} />
                                );
                            })}

                            {/* Current frame — yellow glowing dot */}
                            {chartPrices[currentFrameIndex] > 0 && (
                                <g>
                                    <circle cx={gX(currentFrameIndex)} cy={gY(chartPrices[currentFrameIndex])}
                                        r={11} fill="#eab308" fillOpacity="0.12" />
                                    <circle cx={gX(currentFrameIndex)} cy={gY(chartPrices[currentFrameIndex])}
                                        r={5} fill="#eab308" />
                                    <circle cx={gX(currentFrameIndex)} cy={gY(chartPrices[currentFrameIndex])}
                                        r={5} fill="none" stroke="#eab308" strokeWidth="2" strokeOpacity="0.5" />
                                </g>
                            )}

                            {/* X-axis time labels */}
                            {frames.map((frame: any, i: number) => {
                                const step = Math.max(1, Math.floor(frames.length / 7));
                                if (i % step !== 0 && i !== frames.length - 1) return null;
                                const label = getTimeLabel(frame.Time || '');
                                if (!label) return null;
                                return (
                                    <text key={i} x={gX(i)} y={CH - 3}
                                        textAnchor="middle" fontSize="7.5" fill="#334155" fontFamily="monospace">
                                        {label}
                                    </text>
                                );
                            })}
                        </svg>
                    </div>

                    {/* 2×2 Stat Card Grid — 55% on mobile (right of price), auto+right on desktop via sm:order-3 */}
                    <div className="w-[55%] sm:w-auto sm:shrink-0 sm:order-3 grid grid-cols-2 gap-px border-l border-white/[0.05]">
                        <div className="flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-3 bg-[#0d1117]">
                            <span className="text-[8px] sm:text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">PCR (OI)</span>
                            <span className="text-base sm:text-lg font-black text-orange-400 tabular-nums leading-none">{pcr > 0 ? pcr.toFixed(2) : '---'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-3 bg-[#0d1117]">
                            <span className="text-[8px] sm:text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">KEY STRIKE</span>
                            <span className="text-base sm:text-lg font-black text-yellow-400 tabular-nums leading-none">
                                {(!activeFrame?.["Key Strike"] || activeFrame?.["Key Strike"] === "API Error") ? "---" : activeFrame?.["Key Strike"]}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-3 bg-[#0d1117] border-t border-white/[0.04]">
                            <span className="text-[8px] sm:text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">5-MIN BIAS</span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-300">
                                {activeFrame?.["5-Min Trend"]?.includes("BULLISH") ? "BULLISH" : activeFrame?.["5-Min Trend"]?.includes("BEARISH") ? "BEARISH" : "--"}
                            </span>
                        </div>
                        <div className={`flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-3 border-t border-white/[0.04] ${activeFrame?.["1-Min Trend"]?.includes("BULLISH")
                                ? 'bg-green-500/10'
                                : activeFrame?.["1-Min Trend"]?.includes("BEARISH")
                                    ? 'bg-red-500/10'
                                    : 'bg-[#0d1117]'
                            }`}>
                            <span className="text-[8px] sm:text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">1-MIN</span>
                            <span className={`text-[10px] sm:text-xs font-black ${activeFrame?.["1-Min Trend"]?.includes("BULLISH") ? 'text-green-400' :
                                    activeFrame?.["1-Min Trend"]?.includes("BEARISH") ? 'text-red-400' : 'text-slate-500'
                                }`}>
                                {activeFrame?.["1-Min Trend"]?.includes("BULLISH") ? "BULLISH" :
                                    activeFrame?.["1-Min Trend"]?.includes("BEARISH") ? "BEARISH" : "--"}
                            </span>
                        </div>
                    </div>

                </div>
            </div>


            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                {/* LEFT PANEL - OI BATTLEFIELD */}
                <div className="col-span-1 lg:col-span-1 bg-[#111827]/50 border border-white/10 rounded-xl p-4 flex flex-col max-h-[600px] overflow-hidden">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between mb-4">
                        <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-slate-300" /> OI Battlefield</span>
                        <div className="flex items-center gap-3 text-[9px]">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#0ea5e9] rounded-sm" /> CE OI</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#f97316] rounded-sm" /> PE OI</span>
                        </div>
                    </h2>

                    <div className="flex justify-between items-center bg-[#1e293b]/40 border border-white/5 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">PCR</span>
                            <div className="w-24 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 bg-orange-500 rounded-full" style={{ width: Math.min(100, (pcr / 3) * 100) + '%' }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-white tabular-nums leading-none tracking-tight">{pcr > 0 ? pcr.toFixed(2) : '-'}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{pcrBiasText}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2 mb-2 px-2">
                        <div className="text-[#0ea5e9] text-left">CE OI</div>
                        <div className="text-[#0ea5e9] text-center">VOL</div>
                        <div className="text-center text-slate-500">STRIKE</div>
                        <div className="text-[#f97316] text-center">VOL</div>
                        <div className="text-[#f97316] text-right">PE OI</div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                        {optionsChain.length > 0 ? optionsChain.map((opt: any, idx: number) => {
                            const isKeyStrike = opt.Strike?.toString() === activeFrame?.["Key Strike"]?.toString();
                            const isATM = opt.Strike === atmStrike;

                            // Dynamic dot sizes for Volume (min 4px, max 12px)
                            const ceDotSize = Math.max(4, Math.min(12, ((opt.CE_Vol || 0) / maxVol) * 12));
                            const peDotSize = Math.max(4, Math.min(12, ((opt.PE_Vol || 0) / maxVol) * 12));

                            return (
                                <div key={idx} className={`grid grid-cols-5 gap-2 items-center py-2 px-2 rounded-lg font-mono text-xs tabular-nums transition-colors ${isKeyStrike || isATM ? 'border border-yellow-500/30 bg-yellow-500/5' : 'border border-transparent hover:bg-white/5'}`}>
                                    <div className="text-[#0ea5e9] text-left">{formatBigNumber(opt.CE_OI)}</div>
                                    <div className="text-center flex items-center justify-center">
                                        <div className="rounded-full bg-[#0ea5e9]/80" style={{ width: ceDotSize, height: ceDotSize }} />
                                    </div>
                                    <div className={`text-center font-bold ${isKeyStrike || isATM ? 'text-yellow-500' : 'text-slate-300'}`}>
                                        {opt.Strike} {isATM && <span className="text-[9px] ml-1 font-bold text-yellow-600">ATM</span>}
                                    </div>
                                    <div className="text-center flex items-center justify-center">
                                        <div className="rounded-full bg-[#f97316]/80" style={{ width: peDotSize, height: peDotSize }} />
                                    </div>
                                    <div className="text-[#f97316] text-right">{formatBigNumber(opt.PE_OI)}</div>
                                </div>
                            );
                        }) : (
                            <div className="h-full flex items-center justify-center text-sm text-slate-500 italic">No valid Options Chain data for this frame</div>
                        )}
                    </div>
                </div>

                {/* CENTER PANEL - LIVE READ & MACRO */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">

                    <div className="bg-[#111827]/50 border border-white/10 rounded-xl p-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                            <TrendingUp className="w-3 h-3 text-orange-400" /> Live Read
                        </h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-[#1e293b]/50 border border-slate-700 rounded-lg p-3">
                                <h3 className="text-[10px] text-primary font-bold uppercase mb-2">Call Side (CE)</h3>
                                <p className="text-xs leading-relaxed text-slate-300">{activeFrame?.["Call Action"] || "Awaiting data..."}</p>
                            </div>
                            <div className="bg-[#1e293b]/50 border border-slate-700 rounded-lg p-3">
                                <h3 className="text-[10px] text-orange-400 font-bold uppercase mb-2">Put Side (PE)</h3>
                                <p className="text-xs leading-relaxed text-slate-300">{activeFrame?.["Put Action"] || "Awaiting data..."}</p>
                            </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-[10px] text-yellow-600/80 uppercase tracking-widest">Key Strike Max OI</span>
                            <span className="text-lg font-black text-yellow-500">{activeFrame?.["Key Strike"] || "---"}</span>
                        </div>
                    </div>

                    <div className="bg-[#111827]/50 border border-white/10 rounded-xl p-4">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">5-Min Macro View</h2>
                        <div className="bg-[#1e293b]/40 rounded p-3 text-xs text-slate-300 leading-relaxed min-h-[60px]">
                            {activeFrame?.["5-Min Execution Summary"] || "No 5-min summary available for this frame."}
                        </div>
                    </div>

                    {/* Hottest Strikes Volume Pulse */}
                    <div className="bg-[#111827]/50 border border-white/10 rounded-xl p-4 flex-1 flex flex-col min-h-[220px]">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                🔥 Volume Pulse - Hottest Strikes
                            </h2>
                            <div className="flex items-center gap-3 text-[9px]">
                                <span className="flex items-center gap-1 text-slate-500"><div className="w-1.5 h-1.5 bg-[#0ea5e9] rounded-sm" /> CE</span>
                                <span className="flex items-center gap-1 text-slate-500"><div className="w-1.5 h-1.5 bg-[#f97316] rounded-sm" /> PE</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-2.5">
                            {(() => {
                                const sortedStrikes = [...optionsChain]
                                    .map((o: any) => ({ ...o, totalVol: (o.CE_Vol || 0) + (o.PE_Vol || 0) }))
                                    .sort((a, b) => b.totalVol - a.totalVol)
                                    .slice(0, 6);

                                if (sortedStrikes.length === 0) {
                                    return <div className="text-center text-sm text-slate-500 italic">No volume data available</div>;
                                }

                                const topTotalVol = Math.max(1, sortedStrikes[0].totalVol);

                                return sortedStrikes.map((opt, i) => {
                                    const cePct = (opt.CE_Vol / topTotalVol) * 100;
                                    const pePct = (opt.PE_Vol / topTotalVol) * 100;
                                    const isKeyStrike = opt.Strike?.toString() === activeFrame?.["Key Strike"]?.toString();

                                    return (
                                        <div key={i} className="flex items-center gap-3 w-full text-xs font-mono">
                                            <div className={`w-[45px] text-right font-bold ${isKeyStrike ? 'text-yellow-500' : 'text-slate-400'}`}>{opt.Strike}</div>
                                            <div className="flex-1 flex h-4 bg-[#0f172a] rounded overflow-hidden">
                                                <div className="h-full bg-[#0ea5e9] transition-all duration-300" style={{ width: `${cePct}%` }} />
                                                <div className="h-full bg-[#f97316] transition-all duration-300" style={{ width: `${pePct}%` }} />
                                            </div>
                                            <div className="w-[85px] text-right text-[10px] tabular-nums whitespace-nowrap">
                                                <span className="text-[#0ea5e9] font-bold">{formatBigNumber(opt.CE_Vol)}</span>
                                                <span className="text-slate-600 mx-1">/</span>
                                                <span className="text-[#f97316] font-bold">{formatBigNumber(opt.PE_Vol)}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                </div>

                {/* RIGHT PANEL - TIMELINE */}
                <div className="col-span-1 lg:col-span-1 bg-[#111827]/50 border border-white/10 rounded-xl p-4 flex flex-col h-[450px] lg:h-[600px]">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between mb-4">
                        <span className="flex items-center gap-2">⏱️ 5-Min Timeline</span>
                        <span className="text-[9px]">TAP TO JUMP</span>
                    </h2>
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {[...(frames || [])].reverse().map((frame: any, reversedIdx: number) => {
                            const idx = (frames.length - 1) - reversedIdx;
                            let displayTime = frame.Time;
                            // Fallback: If Excel sent the timestamp as a raw float decimal (e.g., 46097.388)
                            if (displayTime && !isNaN(Number(displayTime)) && Number(displayTime) > 10000) {
                                const date = new Date(Math.round((Number(displayTime) - 25569) * 86400 * 1000));
                                const formatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
                                if (formatted && formatted !== "Invalid Date") displayTime = formatted;
                            }

                            const currentPrice = parseFloat(frame["Nifty Price"]?.toString().replace(/,/g, '') || "0");
                            const prevPrice = idx > 0 ? parseFloat(frames[idx - 1]["Nifty Price"]?.toString().replace(/,/g, '') || "0") : currentPrice;
                            const diff = currentPrice - prevPrice;
                            const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-slate-500';
                            const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff < 0 ? diff.toFixed(2) : "";

                            // Extract the trends
                            const oneMinTrend = frame["1-Min Trend"] || "---";
                            const fiveMinTrend = frame["5-Min Trend"] || "---";
                            const callAction = frame["Call Action"] || "Data Missing";

                            return (
                                <div
                                    key={idx}
                                    ref={idx === currentFrameIndex ? activeItemRef : null}
                                    onClick={() => {
                                        setCurrentFrameIndex(idx);
                                        setIsPlaying(false);
                                    }}
                                    className={`relative pl-4 border-l-2 cursor-pointer transition-all duration-300 ${idx === currentFrameIndex ? 'border-primary bg-primary/10 py-3 shadow-[inset_4px_0_15px_rgba(var(--primary),0.1)]' : 'border-slate-800 hover:border-slate-600'}`}
                                >
                                    <div className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${idx === currentFrameIndex ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]' : 'bg-slate-700'}`} />

                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-mono text-slate-400">{displayTime}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold font-mono text-white">{frame["Nifty Price"]}</span>
                                            {diff !== 0 && <span className={`text-[9px] font-bold font-mono ${diffColor}`}>{diffStr}</span>}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-1">
                                        <span className={`text-[8px] font-bold px-1 rounded ${oneMinTrend.includes("BULLISH") ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"}`}>{oneMinTrend}</span>
                                        <span className={`text-[8px] font-bold px-1 rounded ${fiveMinTrend.includes("BULLISH") ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"}`}>{fiveMinTrend}</span>
                                        <span className="text-[8px] font-bold px-1 rounded text-yellow-500 bg-yellow-500/10 flex items-center gap-1">
                                            KS {frame["Key Strike"] || "---"}
                                            <TrendingUp className="w-2 h-2" /> SHIFT
                                        </span>
                                    </div>

                                    <p className="text-[10px] text-slate-500 line-clamp-2">{callAction}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* BOTTOM PLAYBACK CONTROLS */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-primary/20 p-4 z-50 flex items-center justify-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => { setIsPlaying(false); setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1)) }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={() => {
                        if (isPlaying) {
                            // Pause
                            setIsPlaying(false);
                        } else {
                            // If at the end or beginning, rewind first then play
                            if (currentFrameIndex >= (frames.length - 1)) {
                                setCurrentFrameIndex(0);
                            }
                            setIsPlaying(true);
                        }
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full text-primary font-bold tracking-widest transition-colors shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                >
                    {isPlaying ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>

                <button
                    onClick={() => { setIsPlaying(false); setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1)) }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                <div className="flex-1 max-w-2xl mx-4 flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max={frames.length - 1}
                        value={currentFrameIndex}
                        onChange={handleSliderChange}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-xs font-mono text-slate-400 whitespace-nowrap min-w-[60px]">{activeFrame?.Time || "00:00"}</span>
                </div>
            </div>
        </div>
    );
}