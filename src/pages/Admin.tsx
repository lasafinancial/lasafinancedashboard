import { useState } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Lock, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
const Admin = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
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

        if (!title || !body || !secretKey) {
            toast({
                title: "Missing Fields",
                description: "Please fill in Title, Message, and Admin Secret Key.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Use relative path to leverage Vite proxy in Dev and same-origin in Prod/Preview
            // This fixes CORS/Port issues when accessing via Network IP (e.g. from phone)
            const endpoint = '/api/admin/send-broadcast';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${secretKey}`
                },
                body: JSON.stringify({
                    title,
                    body,
                    image: imageUrl
                })
            });

            // Handle non-JSON responses (like 404 HTML pages)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await response.text();
                console.error("Non-JSON response:", text);
                throw new Error(`Server returned ${response.status} ${response.statusText}. Check console for details.`);
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

            // Clear form on success, keep secret key
            setTitle('');
            setBody('');
            setImageUrl('');

            // Reset file input if possible, or just ignore since we clear imageUrl

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

    return (
        <div className="container mx-auto p-4 max-w-2xl py-12 space-y-8">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight gradient-text">Admin Panel</h1>
                <p className="text-muted-foreground">Send push notifications to all subscribed users.</p>
            </div>

            <GlassCard className="p-6 md:p-8">
                <form onSubmit={handleSend} className="space-y-6">

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" /> Admin Secret Key
                            </label>
                            <Input
                                type="password"
                                placeholder="Enter admin secret..."
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="bg-background/50 border-white/10"
                            />
                        </div>

                        <div className="h-px bg-white/10 my-4" />

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
                                {/* File Upload Input */}
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="bg-background/50 border-white/10 file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-sm file:font-semibold hover:file:bg-primary/20 transition-colors"
                                    />
                                    {uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                </div>

                                {/* URL Input Fallback */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">OR URL:</span>
                                    <Input
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="bg-background/50 border-white/10 text-sm font-mono h-8"
                                    />
                                </div>
                            </div>

                            {imageUrl && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/20 h-32 flex items-center justify-center relative group">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover opacity-80"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                    <span className="absolute text-xs text-muted-foreground group-hover:hidden">Preview</span>
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl('')}
                                        className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white text-sm font-medium"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                        disabled={loading || uploading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" /> Send Broadcast
                            </>
                        )}
                    </Button>

                </form>
            </GlassCard>

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {result.error ? (
                        <GlassCard className="p-4 border-red-500/30 bg-red-500/10">
                            <div className="flex items-center gap-3 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-semibold">{result.error}</span>
                            </div>
                        </GlassCard>
                    ) : (
                        <GlassCard className="p-4 border-emerald-500/30 bg-emerald-500/10">
                            <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-semibold">Broadcast Completed</span>
                            </div>
                            <div className="text-sm text-muted-foreground pl-8 space-y-1">
                                <p>Sent to: <span className="text-foreground">{result.sentTo} users</span></p>
                                <p>Success: <span className="text-emerald-500">{result.successCount}</span></p>
                                <p>Failed: <span className="text-red-400">{result.failedCount}</span></p>
                            </div>
                        </GlassCard>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Admin;
