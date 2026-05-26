import React, { useMemo, useState } from 'react';
import { useLiveData } from '@/hooks/useLiveData';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Filter, Clock } from 'lucide-react';

export default function DailyNews() {
    const { dailyNews, isLoading } = useLiveData();
    const [filter, setFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');

    // Process and group the news by date
    const { groupedNews, dates } = useMemo(() => {
        if (!dailyNews || dailyNews.length === 0) return { groupedNews: {}, dates: [] };

        // Filter news based on selected tab
        const filteredNews = dailyNews.filter(item =>
            filter === 'ALL' || item.impact?.toUpperCase() === filter
        );

        const groups: Record<string, typeof dailyNews> = {};

        // Group by exact date string from the sheet
        filteredNews.forEach(item => {
            const dateKey = item.date || 'Unknown Date';
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
        });

        // Sort dates descending (newest first assuming YYYY-MM-DD format)
        const sortedDates = Object.keys(groups).sort((a, b) => {
            if (a === 'Unknown Date') return 1;
            if (b === 'Unknown Date') return -1;
            return new Date(b).getTime() - new Date(a).getTime();
        });

        return { groupedNews: groups, dates: sortedDates };
    }, [dailyNews, filter]);

    // Format date nicely (e.g., "12th March 2026")
    const formatDate = (dateStr: string) => {
        if (dateStr === 'Unknown Date') return dateStr;
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;

            return new Intl.DateTimeFormat('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    const getImpactBadge = (impact: string) => {
        const val = (impact || '').toUpperCase();
        if (val === 'POSITIVE') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold border border-success/20">
                    <TrendingUp className="h-3 w-3" />
                    Positive
                </span>
            );
        }
        if (val === 'NEGATIVE') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20">
                    <TrendingDown className="h-3 w-3" />
                    Negative
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning justify-center text-xs font-semibold border border-warning/20">
                <Minus className="h-3 w-3" />
                Neutral
            </span>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                            <Newspaper className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight uppercase">NEWS</h1>
                    </div>
                    <p className="text-muted-foreground ml-1">
                        Curated daily market-moving news and sector impacts
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-secondary/50 border border-border/50 backdrop-blur-sm self-start md:self-auto">
                    {(['ALL', 'POSITIVE', 'NEGATIVE', 'NEUTRAL'] as const).map((impactFilter) => (
                        <button
                            key={impactFilter}
                            onClick={() => setFilter(impactFilter)}
                            className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${filter === impactFilter
                                    ? 'bg-background text-foreground shadow-sm ring-1 ring-white/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
              `}
                        >
                            {impactFilter === 'ALL' && <Filter className="inline-block w-4 h-4 mr-2" />}
                            {impactFilter !== 'ALL' && impactFilter.charAt(0) + impactFilter.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
            ) : !dailyNews || dailyNews.length === 0 ? (
                <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border/50">
                    <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No News Available</h3>
                    <p className="text-muted-foreground">Check back later for daily market updates.</p>
                </div>
            ) : dates.length === 0 ? (
                <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border/50">
                    <Filter className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No {filter.toLowerCase()} news today</h3>
                    <p className="text-muted-foreground">Try changing your filters to see more results.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {dates.map((date) => (
                        <div key={date} className="relative">
                            {/* Date Header */}
                            <div className="flex items-center gap-4 mb-3 sticky top-[94px] md:top-20 z-10 bg-background/80 backdrop-blur-md py-4 ring-1 ring-white/5 rounded-2xl px-6 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                                <div className="p-2 bg-secondary rounded-lg">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">
                                    {new Date(date).toDateString() === new Date().toDateString() ? 'Today' : formatDate(date)}
                                    {new Date(date).toDateString() === new Date().toDateString() && ` — ${formatDate(date)}`}
                                </h2>
                                <div className="h-px bg-white/10 flex-grow rounded-full ml-4" />
                            </div>

                            {/* News Cards Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-2 md:pl-10 relative">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-6 md:left-14 top-0 bottom-0 w-px bg-white/5 hidden md:block" />

                                {groupedNews[date].map((item, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={`${date}-${item.stock}-${idx}`}
                                        className="
                      bg-secondary/20 hover:bg-secondary/40 border border-border/50 
                      rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:border-white/10
                      group relative overflow-hidden
                    "
                                    >
                                        {/* Subtle gradient background based on impact */}
                                        {item.impact?.toUpperCase() === 'POSITIVE' && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                                        )}
                                        {item.impact?.toUpperCase() === 'NEGATIVE' && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                                        )}

                                        <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="font-bold text-base text-primary">{item.stock}</span>
                                                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        {item.company}
                                                    </span>
                                                </div>
                                                {item.sector && (
                                                    <span className="inline-block text-[11px] font-medium tracking-wider uppercase text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">
                                                        {item.sector}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {getImpactBadge(item.impact)}
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="text-foreground font-medium text-sm mb-3 leading-snug">
                                                {item.news}
                                            </h3>

                                            {item.reason && (
                                                <div className="bg-background/50 rounded-xl p-3 mb-4 border border-white/5 text-xs text-muted-foreground leading-relaxed">
                                                    <span className="font-semibold text-foreground/80 mb-1 block">Why it matters:</span>
                                                    {item.reason}
                                                </div>
                                            )}
                                        </div>

                                        {item.source && (
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    Source: <span className="text-foreground/80 font-medium">{item.source}</span>
                                                </span>
                                                {/* Optional: If source is a URL, we could make this an actual link */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
