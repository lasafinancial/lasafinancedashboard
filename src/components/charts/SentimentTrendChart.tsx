import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine
} from 'recharts';

interface SentimentTrendProps {
    data: Array<{
        date: string;
        bullish: number;
        bearish: number;
        neutral: number;
    }>;
}

const SentimentTrendChart = ({ data }: SentimentTrendProps) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-[180px] mt-6 mb-2 animate-fade-in relative group/chart">
            <div className="absolute inset-0 bg-white/[0.01] rounded-xl border border-white/5 -z-10 group-hover/chart:bg-white/[0.02] transition-colors" />

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBullish" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBearish" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                        dy={10}
                    />
                    <YAxis
                        hide
                        domain={[0, 100]}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${Math.round(value)}%`, ""]}
                        contentStyle={{
                            backgroundColor: 'rgba(2, 6, 23, 0.95)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(8px)'
                        }}
                        itemStyle={{ padding: '2px 0' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="bullish"
                        name="Bullish %"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorBullish)"
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="bearish"
                        name="Bearish %"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorBearish)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div className="absolute top-2 left-4 flex gap-4 pointer-events-none">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Bullish Trend</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] border border-dashed" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Bearish Trend</span>
                </div>
            </div>
        </div>
    );
};

export default SentimentTrendChart;
