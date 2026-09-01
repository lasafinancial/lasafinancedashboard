import { useState, useEffect } from "react";
import { Search, Book, Rocket, HelpCircle, ChevronRight, MessageSquare, Sparkles, ArrowLeft, Loader2, Info, FileText, Share2, Printer, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = 'landing' | 'category' | 'article' | 'search';

const Help = () => {
    const [view, setView] = useState<ViewState>('landing');
    const [searchQuery, setSearchQuery] = useState("");
    const [articles, setArticles] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    useEffect(() => {
        const q = query(collection(db, 'help_articles'), orderBy('title', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const helpData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArticles(helpData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const categories = [
        { id: "General", title: "Getting Started", icon: Rocket, color: "text-blue-500", bg: "bg-blue-500/10", description: "New to LASA? Start here for a guided tour." },
        { id: "Market Analysis", title: "Market Analysis", icon: Book, color: "text-purple-500", bg: "bg-purple-500/10", description: "Master scanners, RSI, and technical triggers." },
        { id: "Account & Billing", title: "Account & Billing", icon: HelpCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Manage subscriptions and security settings." },
        { id: "Technical Setup", title: "Technical Setup", icon: Info, color: "text-orange-500", bg: "bg-orange-500/10", description: "Desktop alerts, browser tweaks, and compliance." }
    ];

    const filteredArticles = articles.filter(a => a.category === selectedCategory);
    const searchResults = searchQuery.trim()
        ? articles.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const handleAskAI = () => {
        if (!searchQuery.trim()) return;
        setIsThinking(true);
        setView('search');

        // Simulate AI search through docs
        setTimeout(() => {
            const matches = articles.filter(a =>
                a.title.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (matches.length > 0) {
                setAiResponse(`Based on our help documentation, I found information about "${matches[0].title}".\n\n${matches[0].content.substring(0, 200)}...\n\nYou can read the full article below.`);
            } else {
                setAiResponse(`I couldn't find a direct match in our articles for "${searchQuery}", but generally this relates to our platform's analytics features. Would you like to browse the categories?`);
            }
            setIsThinking(false);
        }, 1500);
    };

    const renderLanding = () => (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-16">
            <div className="text-center space-y-8">
                <motion.div variants={itemVariants} className="space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight gradient-text leading-tight">How can we help?</h1>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                        Search our knowledge base or let LASA Research Services assist you.
                    </p>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <GlassCard className="max-w-3xl mx-auto p-2 border-primary/20 bg-primary/5 shadow-2xl shadow-primary/10">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40" />
                                <Input
                                    placeholder="Ask LASA Research Services: 'Why should I upgrade to Pro?'"
                                    className="pl-14 h-16 bg-transparent border-none text-lg placeholder:text-muted-foreground/30 focus-visible:ring-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                />
                            </div>
                            <Button onClick={handleAskAI} className="h-16 px-10 rounded-xl font-bold gap-2 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                                Ask AI <Sparkles className="h-5 w-5" />
                            </Button>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const count = articles.filter(a => a.category === cat.id).length;
                    return (
                        <motion.div key={cat.id} variants={itemVariants} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                            <GlassCard
                                className="h-full group border-white/5 hover:border-primary/40 cursor-pointer transition-all"
                                contentClassName="p-8 flex flex-col items-start gap-4 h-full"
                                onClick={() => { setSelectedCategory(cat.id); setView('category'); }}
                            >
                                <div className={`h-14 w-14 ${cat.bg} rounded-2xl flex items-center justify-center ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`h-7 w-7 ${cat.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{cat.title}</h3>
                                    <p className="text-sm text-muted-foreground/70 mt-2 leading-relaxed">{cat.description}</p>
                                </div>
                                <div className="mt-auto pt-6 flex items-center justify-between w-full text-muted-foreground group-hover:text-foreground">
                                    <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{count} Articles</span>
                                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            <GlassCard className="p-10 border-dashed border-white/10 text-center space-y-8 bg-white/[0.02]">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Still feeling lost?</h2>
                    <p className="text-muted-foreground text-lg">Our trading experts are just a click away.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="outline" className="h-14 px-10 rounded-2xl border-white/10 text-lg hover:bg-white/5 font-bold">Contact Support</Button>
                    <Button className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">Chat with Experts</Button>
                </div>
            </GlassCard>
        </motion.div>
    );

    const renderCategory = () => (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <Button variant="ghost" onClick={() => setView('landing')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-white/5 h-12 rounded-xl">
                <ArrowLeft className="h-5 w-5" /> Back to Help Center
            </Button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
                <div className="space-y-2">
                    <h2 className="text-5xl font-black gradient-text">{selectedCategory}</h2>
                    <p className="text-xl text-muted-foreground/80 font-medium tracking-tight">Expert insights and setup guides.</p>
                </div>
                <Badge className="h-10 px-6 rounded-full bg-primary/10 text-primary border-primary/20 text-sm font-bold">{filteredArticles.length} Articles</Badge>
            </div>

            <div className="grid gap-4">
                {filteredArticles.length === 0 ? (
                    <GlassCard className="p-20 text-center text-muted-foreground/50 text-lg italic">Articles coming soon to this section.</GlassCard>
                ) : (
                    filteredArticles.map(article => (
                        <motion.div key={article.id} whileHover={{ x: 10 }} transition={{ type: "spring", stiffness: 400 }}>
                            <GlassCard
                                className="hover:border-primary/20 cursor-pointer group bg-white/[0.02]"
                                contentClassName="p-8 flex items-center justify-between gap-6"
                                onClick={() => { setSelectedArticle(article); setView('article'); }}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <FileText className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-2xl group-hover:text-primary transition-colors">{article.title}</h4>
                                        <p className="text-muted-foreground/60 line-clamp-2 max-w-xl font-medium leading-relaxed">{article.content}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </GlassCard>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );

    const renderArticle = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setView(selectedCategory ? 'category' : 'landing')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-white/5 h-12 rounded-xl">
                    <ArrowLeft className="h-5 w-5" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10 border-white/5 hover:bg-white/5"><Share2 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 border-white/5 hover:bg-white/5"><Printer className="h-4 w-4" /></Button>
                </div>
            </div>

            <GlassCard className="p-10 md:p-16 border-white/10 shadow-3xl bg-white/[0.01]">
                <div className="space-y-6 mb-12 border-b border-white/5 pb-12">
                    <div className="flex items-center gap-4">
                        <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-[0.2em] text-[11px] font-black px-4 py-1">{selectedArticle.category}</Badge>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
                            <Check className="h-3 w-3 text-emerald-500" /> Human Verified
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">{selectedArticle.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/20" />
                            <span>LASA Research Services team</span>
                        </div>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span>Updated {selectedArticle.updatedAt?.toDate().toLocaleDateString() || 'Recently'}</span>
                    </div>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-foreground/80 leading-[1.8] font-medium whitespace-pre-wrap">
                    {selectedArticle.content}
                </div>

                <div className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-8">
                    <p className="text-xl font-bold">Was this article helpful?</p>
                    <div className="flex gap-4">
                        <Button className="h-14 px-12 rounded-2xl bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 font-bold text-lg">Yes, very!</Button>
                        <Button variant="outline" className="h-14 px-12 rounded-2xl border-white/10 font-bold text-lg">No, I'm still confused</Button>
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-6 pt-12">
                <h3 className="text-xl font-black uppercase tracking-widest text-muted-foreground/50">More in {selectedArticle.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {articles.filter(a => a.category === selectedArticle.category && a.id !== selectedArticle.id).slice(0, 2).map(a => (
                        <GlassCard key={a.id} className="p-6 hover:border-primary/20 cursor-pointer group" onClick={() => { setSelectedArticle(a); window.scrollTo(0, 0); }}>
                            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{a.title}</h4>
                            <p className="text-sm text-muted-foreground/60 line-clamp-1 mt-1">{a.content}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    const renderSearch = () => (
        <div className="space-y-8">
            <Button variant="ghost" onClick={() => setView('landing')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Help Center
            </Button>

            {/* AI Assistant Response */}
            <GlassCard className="p-8 border-primary/30 bg-primary/5 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="h-8 w-8 text-primary opacity-20" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">LASA Research Services Assistant</h3>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Intelligent Search</p>
                    </div>
                </div>

                {isThinking ? (
                    <div className="flex items-center gap-3 py-4 text-muted-foreground italic">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyzing documentation...
                    </div>
                ) : (
                    <div className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap animate-in fade-in duration-500">
                        {aiResponse}
                    </div>
                )}
            </GlassCard>

            {/* Matching Articles */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground px-2">Matching Articles</h4>
                <div className="grid gap-4">
                    {searchResults.length === 0 ? (
                        <p className="text-center py-10 text-muted-foreground italic">No direct matches found. Try a different query.</p>
                    ) : (
                        searchResults.map(article => (
                            <motion.div key={article.id} whileHover={{ x: 10 }} transition={{ type: "spring", stiffness: 400 }}>
                                <GlassCard
                                    className="hover:border-primary/30 cursor-pointer group bg-white/[0.02]"
                                    contentClassName="p-8 flex items-center justify-between gap-6"
                                    onClick={() => { setSelectedArticle(article); setView('article'); }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                            <FileText className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-2xl group-hover:text-primary transition-colors">{article.title}</h4>
                                            <p className="text-muted-foreground/60 line-clamp-2 max-w-xl font-medium leading-relaxed">{article.content}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </GlassCard>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            {loading ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading Help Center...</p>
                </div>
            ) : (
                <>
                    {view === 'landing' && renderLanding()}
                    {view === 'category' && renderCategory()}
                    {view === 'article' && renderArticle()}
                    {view === 'search' && renderSearch()}
                </>
            )}
        </div>
    );
};

export default Help;
