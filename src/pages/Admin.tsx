import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Lock, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Upload, Users, Search as SearchIcon, Trash2, Crown, UserMinus, UserCheck, RotateCcw, Book, Edit2, Sparkles, Mail, Phone, BarChart3, Clock, MousePointer2, History, ExternalLink, Bell, Star, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { db, requestNotificationPermission, saveTokenToFirestore } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const Admin = () => {
    // Auth State
    const { isAdminAuthorized: isAuthorized, setAdminAuthorized: setIsAuthorized } = useAuth();
    const [password, setPassword] = useState('');

    // Broadcast State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [tokenCount, setTokenCount] = useState<number | null>(null);

    // User Management State
    const [users, setUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [fetchingUsers, setFetchingUsers] = useState(true);

    // Help Management State
    const [helpArticles, setHelpArticles] = useState<any[]>([]);
    const [helpTitle, setHelpTitle] = useState('');
    const [helpContent, setHelpContent] = useState('');
    const [helpCategory, setHelpCategory] = useState('General');
    const [isSavingHelp, setIsSavingHelp] = useState(false);
    const [editingHelpId, setEditingHelpId] = useState<string | null>(null);

    // Market Update State (Sir's Desk)
    const [marketUpdate, setMarketUpdate] = useState('');
    const [marketUpdateHistory, setMarketUpdateHistory] = useState<any[]>([]);
    const [isSavingUpdate, setIsSavingUpdate] = useState(false);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [selectedUserLogs, setSelectedUserLogs] = useState<any[]>([]);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [focusedUser, setFocusedUser] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Fetch users for User Management
    useEffect(() => {
        if (!isAuthorized) return;

        // Fetch users
        const qUsers = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
            setFetchingUsers(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setFetchingUsers(false);
        });

        // Fetch help articles
        const qHelp = query(collection(db, 'help_articles'), orderBy('title', 'asc'));
        const unsubscribeHelp = onSnapshot(qHelp, (snapshot) => {
            const helpData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHelpArticles(helpData);
        });

        // Fetch market history
        const qMarket = query(collection(db, 'sir_edits'), orderBy('timestamp', 'desc'));
        const unsubscribeMarket = onSnapshot(qMarket, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
            setMarketUpdateHistory(history);
            if (history.length > 0 && !marketUpdate) {
                // Pre-fill with latest if empty
                setMarketUpdate(history[0].content);
            }
        });

        // Fetch activity logs
        const qLogs = query(collection(db, 'user_activity_logs'), orderBy('timestamp', 'desc'));
        const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivityLogs(logs);
        });

        // Fetch fcm_tokens count
        const unsubscribeTokens = onSnapshot(collection(db, 'fcm_tokens'), (snapshot) => {
            setTokenCount(snapshot.size);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeHelp();
            unsubscribeMarket();
            unsubscribeLogs();
            unsubscribeTokens();
        };
    }, [isAuthorized]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'lasa123') {
            setIsAuthorized(true);
            toast({
                title: "Login Successful",
                description: "Welcome back, Admin.",
            });
        } else {
            toast({
                title: "Invalid Password",
                description: "Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid File",
                description: "Please upload an image file (PNG, JPG, etc.)",
                variant: "destructive"
            });
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('api_key', 'faeed3b773d47f1388de7ebdce0bb11b');
            formData.append('file', file);

            const response = await fetch('https://api.imghippo.com/v1/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setImageUrl(data.data.url);
                toast({
                    title: "Image Uploaded",
                    description: "Image hosted via ImgHippo.",
                });
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: "Upload Failed",
                description: error.message || "Could not upload image.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !body) {
            toast({
                title: "Missing Fields",
                description: "Please fill in Title and Message.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const endpoint = '/api/admin/send-broadcast';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer lasa123` // Use authorized password as secret key
                },
                body: JSON.stringify({
                    title,
                    body,
                    image: imageUrl
                })
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}. Check logs.`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send notifications');
            }

            setResult(data);
            toast({
                title: "Success",
                description: `Sent to ${data.successCount} users!`,
            });

            setTitle('');
            setBody('');
            setImageUrl('');

        } catch (error: any) {
            console.error('Send error:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const updateUserTier = async (userId: string, newTier: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                tier: newTier
            });
            toast({
                title: "Tier Updated",
                description: `User is now ${newTier.toUpperCase()}`,
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                variant: "destructive"
            });
        }
    };

    const toggleUserActivation = async (userId: string, isCurrentlyDeactivated: boolean) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                isDeactivated: !isCurrentlyDeactivated,
                deactivatedAt: !isCurrentlyDeactivated ? serverTimestamp() : null
            });
            toast({
                title: isCurrentlyDeactivated ? "Account Restored" : "Account Deactivated",
                description: isCurrentlyDeactivated ? "User can now login again." : "User session has been terminated.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                variant: "destructive"
            });
        }
    };

    const deleteUserPermanently = async (userId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            toast({
                title: "User Deleted Permanently",
                description: "All profile data has been removed from the database.",
            });
        } catch (error) {
            toast({
                title: "Deletion Failed",
                description: "Could not remove user record.",
                variant: "destructive"
            });
        }
    };

    const handleSaveHelp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!helpTitle || !helpContent) {
            toast({ title: "Missing Fields", variant: "destructive" });
            return;
        }

        setIsSavingHelp(true);
        try {
            if (editingHelpId) {
                await updateDoc(doc(db, 'help_articles', editingHelpId), {
                    title: helpTitle,
                    content: helpContent,
                    category: helpCategory,
                    updatedAt: serverTimestamp()
                });
                toast({ title: "Article Updated" });
            } else {
                await addDoc(collection(db, 'help_articles'), {
                    title: helpTitle,
                    content: helpContent,
                    category: helpCategory,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                toast({ title: "Article Created" });
            }
            setHelpTitle('');
            setHelpContent('');
            setEditingHelpId(null);
        } catch (error) {
            toast({ title: "Save Failed", variant: "destructive" });
        } finally {
            setIsSavingHelp(false);
        }
    };

    const deleteHelpArticle = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'help_articles', id));
            toast({ title: "Article Deleted" });
        } catch (error) {
            toast({ title: "Delete Failed", variant: "destructive" });
        }
    };

    const handleSeedHelp = async () => {
        setIsSavingHelp(true);
        const docs = [
            {
                title: "What is Support & Resistance? 📈",
                category: "Market Analysis",
                content: "Every trader must understand these two pillars of price action:\n\n1. **Support**: A price level where a downtrend tends to pause due to a concentration of demand. It acts as a 'floor' for the price.\n2. **Resistance**: A price level where an uptrend tends to pause due to a concentration of supply. It acts as a 'ceiling' for the price.\n\n### Why are they important?\nSupport and Resistance help you identify high-probability entry and exit zones. LASA scanners precisely map these zones using historical volume and price rejection patterns."
            },
            {
                title: "Use of Support & Resistance 🎯",
                category: "Market Analysis",
                content: "- **Using Support**: We use Support to find the 'Tightest Stop-Loss' setups. Buying near support ensures that if the level breaks, your risk is minimal.\n- **Using Resistance**: Resistance is used to set 'Take Profit' targets. It tells you where the price might encounter selling pressure, allowing you to secure gains before a reversal."
            },
            {
                title: "Decoding 'Model Price' 🧠",
                category: "Market Analysis",
                content: "The **Model Price** is a proprietary LASA calculation. It represents the 'Fair Value' of a stock based on its current trend speed and structural momentum.\n\n### Why is Model Price lower in Uptrends?\nIn a strong uptrend, the Model Price acts as a **trailing floor**. It intentionally 'lags' slightly below the current market price to provide a safety reference. \n\n**Note**: As long as the market price stays above the Model Price, the uptrend is considered healthy. If the market price crashes below the Model Price, it is a major warning signal of a trend shift."
            },
            {
                title: "Breakout vs. Breakdown 📉",
                category: "Market Analysis",
                content: "- **Support Broken (Breakdown)**: When a stock closes below a major support level, it implies that the 'floor' has collapsed. This often leads to a fast slide towards the next support zone.\n- **Resistance Broken (Breakout)**: When a stock closes above a major resistance level, it signals that buyers have overwhelmed sellers. This often triggers a rapid move higher as new momentum enters the stock."
            },
            {
                title: "When should we buy a falling stock? 🛡️",
                category: "Market Analysis",
                content: "Buying a stock while it is falling is often called 'catching a falling knife'—it is highly risky. \n\n**The LASA Strategy:**\n1. Wait for the stock to hit a known **Support Zone**.\n2. Watch for the **Support Reversal** scanner to trigger.\n3. Only enter when you see a price rejection (green candle or long wick at the bottom) at that support level.\n\nNever buy just because the price is lower; buy because the price has stopped falling and started reversing."
            },
            {
                title: "Enabling Desktop Alerts 🔔",
                category: "Technical Setup",
                content: "Don't miss a breakout because your browser blocked a notification.\n\n### Setup Guide:\n1. Click the **Notification Bell** in the top right of the dashboard.\n2. When your browser asks for permission, click **'Allow'**.\n3. If it fails, go to Browser Settings -> Privacy -> Site Settings -> Notifications and ensure `lasafinance.com` is on the allowed list."
            },
            {
                title: "Privacy & IP Compliance 🛡️",
                category: "Technical Setup",
                content: "To meet regulatory standards, we log the Public IP address and Timestamp when you accept our Terms of Service. \n\nThis acts as a 'Digital Signature', proving that you have agreed to the market risks. This protects both the platform and you. Your IP is stored securely and is never shared with 3rd parties."
            }
        ];

        try {
            for (const docData of docs) {
                // Check if already exists to avoid duplicates
                const exists = helpArticles.find(a => a.title === docData.title);
                if (!exists) {
                    await addDoc(collection(db, 'help_articles'), {
                        ...docData,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }
            toast({ title: "Pro Docs Seeded!" });
        } catch (error) {
            toast({ title: "Seeding failed", variant: "destructive" });
        } finally {
            setIsSavingHelp(false);
        }
    };

    // Analytics Calculations
    const totalLogins = activityLogs.filter(log => log.action === 'session_start').length;
    const uniqueUsersCount = new Set(activityLogs.map(log => log.uid)).size;
    const totalPageViews = activityLogs.filter(log => log.action === 'page_view').length;

    const topPages = Object.entries(
        activityLogs
            .filter(log => log.action === 'page_view')
            .reduce((acc: any, log) => {
                if (!acc[log.path]) {
                    acc[log.path] = { count: 0, totalTime: 0 };
                }
                acc[log.path].count += 1;
                acc[log.path].totalTime += (log.timeSpent || 0);
                return acc;
            }, {})
    )
        .sort((a: any, b: any) => b[1].count - a[1].count)
        .slice(0, 5);

    const handleViewUserLogs = (user: any) => {
        const userLogs = activityLogs.filter(log => log.uid === user.id);
        setFocusedUser(user);
        setSelectedUserLogs(userLogs);
        setShowLogsModal(true);
    };

    const handleSaveMarketUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marketUpdate.trim()) {
            toast({ title: "Content is empty", variant: "destructive" });
            return;
        }

        setIsSavingUpdate(true);
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB'); // dd/mm/yyyy
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            await addDoc(collection(db, 'sir_edits'), {
                content: marketUpdate,
                date: dateStr,
                time: timeStr,
                timestamp: serverTimestamp(),
                author: 'Admin'
            });
            toast({ title: "Update Published", description: "Saved to sir_edits collection." });
        } catch (error) {
            toast({ title: "Failed to save", variant: "destructive" });
        } finally {
            setIsSavingUpdate(false);
        }
    };

    const deleteMarketHistory = async (id: string) => {
        if (!id) return;
        try {
            await deleteDoc(doc(db, 'sir_edits', id));
            toast({
                title: "History Record Deleted",
            });
        } catch (error: any) {
            console.error("[Admin] Delete error:", error);
            toast({
                title: "Delete Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
        (u.phoneNumber || '').includes(userSearch)
    );

    const handleSyncAllTiers = async () => {
        if (!window.confirm(`Are you sure you want to force ALL ${users.length} users to the ${FEATURE_FLAGS.FORCE_ELITE_FOR_ALL ? 'ELITE' : 'FREE'} tier in the database?`)) return;

        setIsSyncing(true);
        try {
            const batch = writeBatch(db);
            const targetTier = FEATURE_FLAGS.FORCE_ELITE_FOR_ALL ? 'elite' : 'free';

            // Process in chunks of 500 (Firestore batch limit)
            const chunks = [];
            for (let i = 0; i < users.length; i += 500) {
                chunks.push(users.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const chunkBatch = writeBatch(db);
                chunk.forEach((user: any) => {
                    const userRef = doc(db, 'users', user.id);
                    chunkBatch.update(userRef, { tier: targetTier });
                });
                await chunkBatch.commit();
            }

            toast({
                title: "Global Sync Success",
                description: `Database updated for ${users.length} users. All tiers set to ${targetTier.toUpperCase()}.`,
            });
        } catch (error) {
            console.error("Global sync failed:", error);
            toast({ title: "Sync Failed", description: "Could not update all user records.", variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Never';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0s';
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) return `${mins}m ${secs}s`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}h ${remainingMins}m`;
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <GlassCard className="p-10 md:p-12 w-full max-w-md space-y-10 text-center shadow-2xl">
                    <div className="space-y-4">
                        <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/40">
                            <Lock className="w-7 h-7 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight gradient-text">Admin Gateway</h2>
                        <p className="text-muted-foreground text-sm px-4">Please enter the security password to proceed to the command center.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 pt-2">
                        <Input
                            type="password"
                            placeholder="Security password..."
                            className="bg-white/5 border-white/10 h-12 text-center text-lg tracking-widest focus:ring-primary/40"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <Button type="submit" className="w-full h-12 font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                            Verify Access
                        </Button>
                    </form>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl py-12 space-y-8">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight gradient-text">Admin Command Center</h1>
                <p className="text-muted-foreground">Manage notifications and user accounts.</p>
            </div>

            <Tabs defaultValue="broadcast" className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-[750px] mx-auto mb-8 bg-white/5 border border-white/10 rounded-xl p-1">
                    <TabsTrigger value="broadcast" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-[10px] sm:text-xs">
                        <Send className="w-4 h-4 mr-2" /> Broadcast
                    </TabsTrigger>
                    <TabsTrigger value="sir-desk" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-[10px] sm:text-xs">
                        <Sparkles className="w-4 h-4 mr-2" /> Sir's Desk
                    </TabsTrigger>
                    <TabsTrigger value="help" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-[10px] sm:text-xs">
                        <Book className="w-4 h-4 mr-2" /> Help Docs
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-[10px] sm:text-xs">
                        <Users className="w-4 h-4 mr-2" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-[10px] sm:text-xs">
                        <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="broadcast" className="flex justify-center">
                    <GlassCard className="p-6 md:p-8 w-full max-w-2xl">
                        <form onSubmit={handleSend} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notification Title</label>
                                    <Input
                                        placeholder="e.g. Market Alert: Nifty Breakout"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-background/50 border-white/10 font-semibold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message Body</label>
                                    <Textarea
                                        placeholder="e.g. Nifty has crossed 22,000 with strong volume..."
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        className="bg-background/50 border-white/10 min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-muted-foreground" /> Image (Optional)
                                    </label>

                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="bg-background/50 border-white/10"
                                            />
                                            {uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                        </div>
                                    </div>

                                    {imageUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/20 h-32 flex items-center justify-center relative group">
                                            <img src={imageUrl} alt="Preview" className="h-full w-full object-cover opacity-80" />
                                            <button type="button" onClick={() => setImageUrl('')} className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white text-sm font-medium">
                                                Remove Image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20" disabled={loading || uploading}>
                                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : <><Send className="w-5 h-5 mr-2" /> Send Broadcast</>}
                            </Button>
                        </form>

                        {result && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                                {result.error ? (
                                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{result.error}</span>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                        <div className="flex items-center gap-3 mb-2 font-semibold text-lg">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Broadcast Completed</span>
                                        </div>
                                        <div className="text-sm grid grid-cols-3 gap-4 text-emerald-400/80">
                                            <div>Sent: {result.sentTo || result.successCount || 0}</div>
                                            <div>Success: {result.successCount || 0}</div>
                                            <div>Failed: {result.failedCount || 0}</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </GlassCard>

                    {/* Standalone Prominent Device Diagnostic Card */}
                    <GlassCard className="p-6 md:p-8 w-full max-w-2xl border-primary/30 bg-gradient-to-b from-primary/10 via-background/40 to-background/60 shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold flex items-center gap-2 gradient-text">
                                    <Bell className="w-5 h-5 text-primary animate-pulse" /> Device Notification Diagnostics
                                </h3>
                                <p className="text-xs text-muted-foreground">Test notification popups directly on your current device.</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                typeof window !== 'undefined' && Notification.permission === 'granted'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : typeof window !== 'undefined' && Notification.permission === 'denied'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                                {typeof window !== 'undefined' ? Notification.permission.toUpperCase() : 'UNKNOWN'}
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs sm:text-sm font-semibold">
                            <span className="flex items-center gap-2 text-white/90">
                                📱 Total Subscribed Devices in Database:
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 font-bold text-sm">
                                {tokenCount !== null ? `${tokenCount} Device(s)` : 'Loading...'}
                            </span>
                        </div>

                        {typeof window !== 'undefined' && Notification.permission === 'denied' && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2">
                                <div className="font-bold text-red-400 flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" /> Notifications Are Blocked in Browser Settings
                                </div>
                                <p>To unblock: Click the Lock 🔒 icon next to your website URL bar ➔ Site Settings ➔ Set <strong>Notifications</strong> to <strong>ALLOW</strong>.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="default"
                                className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                onClick={async () => {
                                    if (Notification.permission === 'default') {
                                        const res = await Notification.requestPermission();
                                        if (res === 'granted') {
                                            window.location.reload();
                                        }
                                        return;
                                    }
                                    if (Notification.permission !== 'granted') {
                                        alert("Notification permission is not granted. Click the Lock icon in your address bar to set Notifications to ALLOW.");
                                        return;
                                    }
                                    try {
                                        if ('serviceWorker' in navigator) {
                                            const reg = await navigator.serviceWorker.ready;
                                            reg.showNotification('🔔 LASA Instant Test', {
                                                body: 'Success! Native push notifications are working on this device.',
                                                icon: '/complogo.png',
                                                badge: '/complogo.png',
                                                requireInteraction: true
                                            });
                                        }
                                        new Notification('🔔 LASA Instant Test', {
                                            body: 'Success! Native push notifications are working on this device.',
                                            icon: '/complogo.png'
                                        });
                                    } catch (e: any) {
                                        alert("Error showing notification: " + e.message);
                                    }
                                }}
                            >
                                🧪 Test Banner on This Device
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 text-sm font-semibold bg-white/5 hover:bg-white/10 border-white/10"
                                onClick={async () => {
                                    try {
                                        if (!('Notification' in window)) {
                                            toast({ title: "Not Supported", description: "Notifications not supported on this browser.", variant: "destructive" });
                                            return;
                                        }
                                        const perm = await Notification.requestPermission();
                                        if (perm !== 'granted') {
                                            toast({ title: "Permission Denied", description: "Please set Notifications to ALLOW in browser settings.", variant: "destructive" });
                                            return;
                                        }
                                        const { messaging } = await import('@/lib/firebase');
                                        const { getToken } = await import('firebase/messaging');
                                        if (!messaging) {
                                            toast({ title: "Initialization Error", description: "Firebase messaging not initialized.", variant: "destructive" });
                                            return;
                                        }
                                        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' });
                                        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BFB8IrNUPvVzjErLSo-dmcd5fAXNYmGvX6vBxnnn2cXNW87AjP9D9lpZxjZFzdS9W0njbYkoTS8rGtMoj260riM';
                                        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
                                        if (token) {
                                            localStorage.setItem('fcm_token', token);
                                            const res = await fetch('/api/save-token', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    token,
                                                    userAgent: navigator.userAgent,
                                                    platform: navigator.platform
                                                })
                                            });
                                            if (res.ok) {
                                                toast({ title: "Token Synced Successfully! 🎉", description: "This device is registered to receive all broadcast notifications." });
                                            } else {
                                                throw new Error("Failed to post token to backend API");
                                            }
                                        } else {
                                            throw new Error("Could not acquire FCM token from browser");
                                        }
                                    } catch (e: any) {
                                        toast({
                                            title: "Sync Status",
                                            description: e.message || "Failed to sync token",
                                            variant: "destructive"
                                        });
                                    }
                                }}
                            >
                                🔄 Re-sync Device Token
                            </Button>
                        </div>
                    </GlassCard>
                </TabsContent>

                <TabsContent value="sir-desk" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <GlassCard className="p-6 md:p-8 h-fit">
                            <form onSubmit={handleSaveMarketUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary" /> Sir's Daily Insights
                                    </h3>
                                    <p className="text-sm text-muted-foreground">The text below will replace the standard "How it Works" on the dashboard.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Market Position Text</label>
                                        <Textarea
                                            placeholder="Write today's market structure insights..."
                                            value={marketUpdate}
                                            onChange={(e) => setMarketUpdate(e.target.value)}
                                            className="bg-background/50 border-white/10 min-h-[250px] leading-relaxed"
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">Markdown is supported. Keep it concise yet punchy.</p>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSavingUpdate}>
                                    {isSavingUpdate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Publish to Dashboard
                                </Button>
                            </form>
                        </GlassCard>

                        <GlassCard className="p-6 md:p-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold">Insight History</h3>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {marketUpdateHistory.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-10 italic">No history yet.</p>
                                    ) : (
                                        marketUpdateHistory.map((update) => (
                                            <div key={update.id} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="outline" className="text-[10px] uppercase border-white/10">{formatDate(update.timestamp)}</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{update.content}</p>
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Insight?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-muted-foreground">
                                                                    Are you sure you want to permanently delete this insight?
                                                                    <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] italic text-foreground/80 line-clamp-4">
                                                                        "{update.content}"
                                                                    </div>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 border-0">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteMarketHistory(update.id)}
                                                                    className="bg-destructive hover:bg-destructive/90 text-white"
                                                                >
                                                                    Delete Forever
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </TabsContent>

                <TabsContent value="help" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Help Article Form */}
                        <GlassCard className="p-6 md:p-8 h-fit">
                            <form onSubmit={handleSaveHelp} className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">{editingHelpId ? 'Edit Article' : 'New Help Article'}</h3>
                                    <p className="text-sm text-muted-foreground">Explain a feature or term to users.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Article Title</label>
                                        <Input
                                            placeholder="e.g. How to use Reaction Zones"
                                            value={helpTitle}
                                            onChange={(e) => setHelpTitle(e.target.value)}
                                            className="bg-background/50 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <select
                                            value={helpCategory}
                                            onChange={(e) => setHelpCategory(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md bg-background/50 border border-white/10 text-sm focus:ring-1 focus:ring-primary"
                                        >
                                            <option>General</option>
                                            <option>Market Analysis</option>
                                            <option>Account & Billing</option>
                                            <option>Technical</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Content (Markdown Supported)</label>
                                        <Textarea
                                            placeholder="Write the explanation here..."
                                            value={helpContent}
                                            onChange={(e) => setHelpContent(e.target.value)}
                                            className="bg-background/50 border-white/10 min-h-[200px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" className="flex-1" disabled={isSavingHelp}>
                                        {isSavingHelp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingHelpId ? 'Update Article' : 'Create Article'}
                                    </Button>
                                    {editingHelpId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingHelpId(null);
                                                setHelpTitle('');
                                                setHelpContent('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </GlassCard>

                        {/* Article List */}
                        <GlassCard className="p-6 md:p-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-xl font-bold">Existing Articles</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSeedHelp}
                                        disabled={isSavingHelp}
                                        className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                    >
                                        <Sparkles className="h-4 w-4" /> Seed Pro Docs
                                    </Button>
                                </div>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {helpArticles.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-10 italic">No articles yet.</p>
                                    ) : (
                                        helpArticles.map((article) => (
                                            <div key={article.id} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider">{article.category}</Badge>
                                                        <h4 className="font-semibold">{article.title}</h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{article.content}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                setEditingHelpId(article.id);
                                                                setHelpTitle(article.title);
                                                                setHelpContent(article.content);
                                                                setHelpCategory(article.category);
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => deleteHelpArticle(article.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </TabsContent>

                <TabsContent value="users">
                    <GlassCard className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                            <div className="relative w-full md:w-96">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or phone..."
                                    className="pl-10 bg-white/5 border-white/10"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Total Users: <span className="text-foreground font-semibold">{users.length}</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-2 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                                    onClick={handleSyncAllTiers}
                                    disabled={isSyncing || users.length === 0}
                                >
                                    {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    Sync All to {FEATURE_FLAGS.FORCE_ELITE_FOR_ALL ? 'ELITE' : 'FREE'}
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow>
                                        <TableHead>User Profile</TableHead>
                                        <TableHead>Email / Phone</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Trader Type</TableHead>
                                        <TableHead>Current Tier</TableHead>
                                        <TableHead>Watchlist</TableHead>
                                        <TableHead>Alerts</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fetchingUsers ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 opacity-50" />
                                                Loading subscribers...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                No users found matching "{userSearch}"
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-white/5 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{user.name || <span className="text-muted-foreground italic">Anonymous</span>}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase truncate max-w-[120px]">{user.id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    <div className="space-y-1">
                                                        {user.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 opacity-50" /> {user.email}</div>}
                                                        {user.phoneNumber && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 opacity-50" /> {user.phoneNumber}</div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase border-white/10 bg-white/5">
                                                        {user.provider === 'google.com' ? 'Google' :
                                                            user.provider === 'microsoft.com' ? 'Office' :
                                                                user.provider === 'phone' ? 'Phone' :
                                                                    user.provider === 'password' ? 'Email' : 'Other'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase border-white/10 bg-white/5 whitespace-nowrap">
                                                        {user.traderType || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge
                                                            variant={user.isDeactivated ? "destructive" : user.tier === 'elite' ? "default" : user.tier === 'pro' ? "secondary" : "outline"}
                                                            className={cn(
                                                                "text-[10px] uppercase font-bold w-fit",
                                                                user.tier === 'elite' && "bg-gradient-to-r from-yellow-400 to-orange-500 border-none shadow-lg shadow-orange-500/20",
                                                                user.tier === 'pro' && "bg-primary/20 text-primary border-primary/30"
                                                            )}
                                                        >
                                                            {user.isDeactivated ? 'Deactivated' : user.tier || 'free'}
                                                        </Badge>
                                                        {FEATURE_FLAGS.FORCE_ELITE_FOR_ALL && user.tier !== 'elite' && (
                                                            <span className="text-[8px] text-orange-500 font-bold uppercase tracking-tighter">
                                                                → Elite (Forced)
                                                            </span>
                                                        )}
                                                        {!FEATURE_FLAGS.FORCE_ELITE_FOR_ALL && user.tier === 'elite' && (
                                                            <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                → Free (Terminated)
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1.5 text-xs cursor-help border-b border-dashed border-white/10 w-fit">
                                                                    <Star className="w-3 h-3 text-yellow-500" />
                                                                    <span className={cn(user.watchlist?.length > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>
                                                                        {user.watchlist?.length || 0}
                                                                    </span>
                                                                    {user.watchlist?.length > 0 && <Info className="w-2.5 h-2.5 opacity-30" />}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-slate-900 border-white/20 text-[10px] p-2 max-w-[200px]">
                                                                <div className="font-bold border-b border-white/10 mb-1 pb-1">Watchlist Stocks:</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {user.watchlist?.map((s: string) => (
                                                                        <Badge key={s} variant="secondary" className="px-1 py-0 h-4 text-[9px] bg-white/10">{s}</Badge>
                                                                    )) || "Empty"}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1.5 text-xs cursor-help border-b border-dashed border-white/10 w-fit">
                                                                    <Bell className="w-3 h-3 text-orange-500" />
                                                                    <span className={cn(user.activeAlerts?.length > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>
                                                                        {user.activeAlerts?.length || 0}
                                                                    </span>
                                                                    {user.activeAlerts?.length > 0 && <Info className="w-2.5 h-2.5 opacity-30" />}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-slate-900 border-white/20 text-[10px] p-2 max-w-[200px]">
                                                                <div className="font-bold border-b border-white/10 mb-1 pb-1 text-orange-400">Monitoring Alerts:</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {user.activeAlerts?.map((s: string) => (
                                                                        <Badge key={s} variant="secondary" className="px-1 py-0 h-4 text-[9px] bg-orange-500/20 text-orange-400 border-orange-500/30">{s}</Badge>
                                                                    )) || "No active alerts"}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>

                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDate(user.lastLoginAt || user.lastLogin)}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-mono opacity-50">
                                                    {user.acceptanceIP || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={cn("h-8 gap-2", user.isDeactivated ? "text-success hover:bg-success/10" : "text-destructive hover:bg-destructive/10")}
                                                            onClick={() => toggleUserActivation(user.id, !!user.isDeactivated)}
                                                        >
                                                            {user.isDeactivated ? (
                                                                <>
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                    Restore
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserMinus className="h-3.5 w-3.5" />
                                                                    Deactivate
                                                                </>
                                                            )}
                                                        </Button>

                                                        {user.isDeactivated && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 gap-2 text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Delete Forever
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl text-white">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete User Permanently?</AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-muted-foreground">
                                                                            This will irreversibly remove all profile data for <span className="text-white font-bold">{user.email || user.phoneNumber || 'this user'}</span>.
                                                                            They can still re-signup later but will be treated as a brand new account.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 border-0">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteUserPermanently(user.id)}
                                                                            className="bg-destructive hover:bg-destructive/90 text-white"
                                                                        >
                                                                            Delete Permanently
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}

                                                        <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-7 px-2 text-[10px] font-bold transition-all",
                                                                    (user.tier === 'free' || !user.tier) ? "bg-white/10 text-white" : "text-muted-foreground opacity-50 hover:opacity-100"
                                                                )}
                                                                onClick={() => updateUserTier(user.id, 'free')}
                                                            >
                                                                FREE
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-7 px-2 text-[10px] font-bold transition-all",
                                                                    user.tier === 'pro' ? "bg-primary text-white" : "text-muted-foreground opacity-50 hover:opacity-100"
                                                                )}
                                                                onClick={() => updateUserTier(user.id, 'pro')}
                                                            >
                                                                PRO
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-7 px-2 text-[10px] font-bold transition-all",
                                                                    user.tier === 'elite' ? "bg-orange-500 text-white" : "text-muted-foreground opacity-50 hover:opacity-100"
                                                                )}
                                                                onClick={() => updateUserTier(user.id, 'elite')}
                                                            >
                                                                <Crown className="h-3 w-3 mr-1" />
                                                                ELITE
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-primary/20 hover:bg-primary/10 text-primary"
                                                            onClick={() => handleViewUserLogs(user)}
                                                        >
                                                            <History className="h-3.5 w-3.5 mr-2" />
                                                            History
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </GlassCard>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-8">
                    {/* Clarification Banner */}
                    <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 flex items-start gap-3">
                        <span className="text-warning text-base">⚠️</span>
                        <div>
                            <p className="text-xs font-bold text-warning uppercase tracking-wider mb-1">Why our numbers are lower than Vercel Analytics</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Our Admin Analytics only counts <span className="font-bold text-foreground">authenticated, logged-in users</span>. Vercel Analytics counts <span className="font-bold text-foreground">all browser visits</span> including unauthenticated visitors, bots, crawlers, and people who land on the login page but never sign in. This is expected — the numbers will always differ.
                            </p>
                        </div>
                    </div>

                    {/* Analytics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassCard className="p-6 border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-primary/20 text-primary">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Auth Sessions</p>
                                    <h3 className="text-2xl font-bold">{totalLogins}</h3>
                                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Logged-in users only</p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Unique Users</p>
                                    <h3 className="text-2xl font-bold">{uniqueUsersCount}</h3>
                                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Distinct accounts (all time)</p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                                    <MousePointer2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Page Views</p>
                                    <h3 className="text-2xl font-bold">{totalPageViews}</h3>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Pages */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" /> Most Visited Sections
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {topPages.map(([path, stats]: [string, any], idx) => (
                                    <div key={path} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                {idx + 1}
                                            </span>
                                            <span className="font-mono text-xs">{path}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="font-bold flex items-center gap-1">
                                                <MousePointer2 className="w-3 h-3" /> {stats.count}
                                            </Badge>
                                            <Badge variant="outline" className="font-bold border-primary/30 text-primary flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {formatDuration(stats.totalTime)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {topPages.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No page view data yet</div>}
                            </div>
                        </GlassCard>

                        {/* Recent Activity Feed */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary" /> Live Activity Feed
                                </h3>
                                <Badge variant="outline" className="animate-pulse border-primary/30 text-primary">Live</Badge>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {activityLogs.slice(0, 20).map((log) => (
                                    <div key={log.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-foreground/90 truncate max-w-[150px]">{log.email}</span>
                                                <Badge className="text-[9px] h-4 uppercase px-1.5" variant={log.action === 'session_start' ? "default" : "secondary"}>
                                                    {log.action?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2">
                                                {log.path && <span className="truncate flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> {log.path}</span>}
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-1">{formatDate(log.timestamp)}</span>
                                    </div>
                                ))}
                                {activityLogs.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Waiting for live data...</div>}
                            </div>
                        </GlassCard>
                    </div>
                </TabsContent>
            </Tabs>

            {/* User Logs Modal */}
            <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
                <DialogContent className="max-w-2xl bg-slate-900/95 border-white/10 backdrop-blur-xl text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <History className="w-5 h-5 text-primary" />
                            Activity History: {focusedUser?.name || 'User'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Detailed interaction logs for UID: <span className="font-mono text-primary/80">{focusedUser?.id}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {/* Today's Stats Summary */}
                    {selectedUserLogs.length > 0 && (() => {
                        const today = new Date().toLocaleDateString('en-IN');
                        const todayLogs = selectedUserLogs.filter(log => {
                            const logDate = (log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp)).toLocaleDateString('en-IN');
                            return logDate === today;
                        });

                        const totalSecondsToday = todayLogs.reduce((acc, log) => acc + (log.timeSpent || 0), 0);
                        const pageBreakdown = todayLogs.reduce((acc: any, log) => {
                            acc[log.path] = (acc[log.path] || 0) + (log.timeSpent || 0);
                            return acc;
                        }, {});

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                    <p className="text-[10px] uppercase font-bold text-primary/70 mb-1">Total Time Today</p>
                                    <h4 className="text-2xl font-black text-primary">{formatDuration(totalSecondsToday)}</h4>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-32 overflow-y-auto custom-scrollbar">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Time per Page (Today)</p>
                                    <div className="space-y-1">
                                        {Object.entries(pageBreakdown).map(([path, time]: [string, any]) => (
                                            <div key={path} className="flex justify-between text-[11px] font-mono">
                                                <span className="truncate opacity-70 pr-2">{path}</span>
                                                <span className="text-primary font-bold">{formatDuration(time)}</span>
                                            </div>
                                        ))}
                                        {Object.keys(pageBreakdown).length === 0 && <p className="text-[10px] italic opacity-50">No data for today</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedUserLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Clock className="w-12 h-12 mb-4 opacity-10" />
                                <p>No activity logs found for this user.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedUserLogs.map((log) => (
                                    <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 group hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <Badge variant={log.action === 'session_start' ? "default" : "secondary"} className="uppercase text-[10px]">
                                                {log.action?.replace('_', ' ')}
                                            </Badge>
                                            <div className="flex items-center gap-3">
                                                {log.timeSpent > 0 && (
                                                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {formatDuration(log.timeSpent)}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            {log.path && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MousePointer2 className="w-3.5 h-3.5" />
                                                    <span className="font-mono bg-black/30 px-1.5 rounded">{log.path}</span>
                                                </div>
                                            )}
                                            {log.userAgent && (
                                                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="truncate opacity-60">UA: {log.userAgent}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Admin;
