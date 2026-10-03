import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, setPendingLogin, LOGIN_DISCLAIMER_VERSION } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Phone, ShieldCheck, ArrowRight, Mail, Chrome } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { FEATURE_FLAGS } from '@/lib/featureFlags';

// ── OTP Input: 6 individual digit boxes ──────────────────────────────────────
const OtpInput = ({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (val: string) => void;
    disabled: boolean;
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Keep 6-element array in sync with value prop
    const digits = value.padEnd(6, '').split('').slice(0, 6);

    const focusBox = (idx: number) => {
        inputRefs.current[idx]?.focus();
    };

    const handleInput = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) return;

        const char = raw[raw.length - 1]; // take last digit typed
        const newDigits = [...digits];
        newDigits[idx] = char;
        const newValue = newDigits.join('').replace(/ /g, '');
        onChange(newValue.slice(0, 6));

        if (idx < 5) focusBox(idx + 1);
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const newDigits = [...digits];
            if (newDigits[idx] && newDigits[idx].trim()) {
                // Clear current box
                newDigits[idx] = ' ';
                onChange(newDigits.join('').trimEnd().slice(0, 6));
            } else if (idx > 0) {
                // Move back and clear
                newDigits[idx - 1] = ' ';
                onChange(newDigits.join('').trimEnd().slice(0, 6));
                focusBox(idx - 1);
            }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
            focusBox(idx - 1);
        } else if (e.key === 'ArrowRight' && idx < 5) {
            focusBox(idx + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
        focusBox(Math.min(pasted.length, 5));
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, idx) => {
                const digit = digits[idx]?.trim() || '';
                return (
                    <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={digit}
                        disabled={disabled}
                        autoFocus={idx === 0}
                        onChange={(e) => handleInput(idx, e)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className={`
                            w-12 h-14 text-center text-xl font-black rounded-xl border bg-white/5
                            text-white outline-none transition-all duration-150
                            ${digit
                                ? 'border-primary/70 bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                                : 'border-white/10'}
                            focus:border-primary focus:bg-primary/10 focus:shadow-[0_0_12px_rgba(var(--primary),0.3)]
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    />
                );
            })}
        </div>
    );
};

// ── Main Login Component ──────────────────────────────────────────────────────
const Login = () => {
    const [step, setStep] = useState<'PHONE' | 'OTP' | 'EMAIL_SENT'>(
        FEATURE_FLAGS.ENABLE_PHONE_LOGIN ? 'PHONE' : 'PHONE' // logical step stays phone, but tab defaults to email
    );
    const [activeTab, setActiveTab] = useState(FEATURE_FLAGS.ENABLE_PHONE_LOGIN ? 'phone' : 'email');
    const showPhoneOrEmail = FEATURE_FLAGS.ENABLE_PHONE_LOGIN || FEATURE_FLAGS.ENABLE_EMAIL_LOGIN;
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    // After sign-in, go back to the page that sent the user here (e.g. the 5-minute login prompt)
    const location = useLocation();
    const redirectTo = (location.state as { from?: string } | null)?.from || '/';
    const [fullName, setFullName] = useState('');
    const [newsletterOptIn, setNewsletterOptIn] = useState(true);
    // Required, unticked by default: users must actively agree to the disclaimer
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const signupDetailsValid = fullName.trim().length > 0 && phoneNumber.length === 10;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const {
        user,
        loading: authLoading,
        twilioSendOtp,
        twilioVerifyOtp,
        signInWithGoogle,
        signInWithMicrosoft,
        sendMagicLink
    } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            navigate('/', { replace: true });
        }
    }, [user, authLoading, navigate]);

    // Only allow exactly 10 digits
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(val);
    };

    const getFormattedPhone = () => `+91${phoneNumber}`;

    const handleSendOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const formatted = getFormattedPhone();
        if (phoneNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            await twilioSendOtp(formatted);
            setOtp('');
            setStep('OTP');
            toast.success('OTP sent! Check your SMS 📱');
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            toast.error(error.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (otp.replace(/\s/g, '').length !== 6) {
            toast.error('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        try {
            await twilioVerifyOtp(getFormattedPhone(), otp.replace(/\s/g, ''));
            toast.success('Login Successful! 🎉');
            navigate(redirectTo, { replace: true });
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            toast.error(error.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtp('');
        toast.info('Resending OTP...');
        await handleSendOtp();
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            await sendMagicLink(email);
            setStep('EMAIL_SENT');
            toast.success('Magic link sent to your email!');
        } catch (error) {
            console.error('Error sending email link:', error);
            toast.error('Failed to send login link. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialAuth = async (provider: 'google' | 'microsoft', withSignupDetails = false) => {
        setLoading(true);
        try {
            // Signing in from this page accepts the disclaimer shown on it; log it for compliance
            let ip = 'Unknown';
            try {
                const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
                if (r.ok) ip = (await r.json()).ip || ip;
            } catch {
                // IP lookup is best-effort
            }
            setPendingLogin({
                profile: withSignupDetails
                    ? { name: fullName.trim(), phoneNumber: getFormattedPhone(), newsletterOptIn }
                    : undefined,
                acceptance: { version: LOGIN_DISCLAIMER_VERSION, ip },
            });
            if (provider === 'google') await signInWithGoogle();
            else await signInWithMicrosoft();
            toast.success('Login Successful!');
            navigate(redirectTo, { replace: true });
        } catch (error) {
            setPendingLogin(null);
            console.error('Social Auth Error:', error);
            toast.error('Failed to sign in. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
            <Toaster richColors position="top-center" />
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute h-full w-full bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />

            <Card className="w-full max-w-md relative z-10 bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader className="space-y-4 pb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-2 mx-auto ring-1 ring-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            {step === 'PHONE' ? 'Access Terminal' : step === 'OTP' ? 'Verify Identity' : 'Check Email'}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {step === 'PHONE'
                                ? 'Authenticate to enter the LASA Dashboard'
                                : step === 'OTP'
                                    ? `Code sent to ${getFormattedPhone()}`
                                    : `We've sent a login link to ${email}`
                            }
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <AnimatePresence mode="wait">

                        {/* ── Step 1: Phone / Email / Social ─────────────── */}
                        {step === 'PHONE' && (
                            <motion.div
                                key="phone-step"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {showPhoneOrEmail && (<>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className={`grid w-full ${FEATURE_FLAGS.ENABLE_PHONE_LOGIN && FEATURE_FLAGS.ENABLE_EMAIL_LOGIN ? 'grid-cols-2' : 'grid-cols-1'} mb-8 bg-white/5 border border-white/10 h-12`}>
                                        {FEATURE_FLAGS.ENABLE_PHONE_LOGIN && <TabsTrigger value="phone" className="data-[state=active]:bg-primary/20">Phone</TabsTrigger>}
                                        {FEATURE_FLAGS.ENABLE_EMAIL_LOGIN && <TabsTrigger value="email" className="data-[state=active]:bg-primary/20">Email</TabsTrigger>}
                                    </TabsList>

                                    {/* Phone Tab */}
                                    {FEATURE_FLAGS.ENABLE_PHONE_LOGIN && (
                                        <TabsContent value="phone" className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <div className="relative flex">
                                                    <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md border-white/10 bg-white/5 text-muted-foreground font-mono text-sm">
                                                        +91
                                                    </div>
                                                    <Input
                                                        id="phone"
                                                        placeholder="99999 99999"
                                                        className="flex-1 rounded-l-none h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-colors font-mono"
                                                        value={phoneNumber}
                                                        onChange={handlePhoneChange}
                                                        disabled={loading}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleSendOtp}
                                                className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20"
                                                disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ArrowRight className="ml-2 h-4 w-4" /></>}
                                            </Button>
                                        </TabsContent>
                                    )}

                                    {/* Email Tab */}
                                    {FEATURE_FLAGS.ENABLE_EMAIL_LOGIN && (
                                    <TabsContent value="email" className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="trader@example.com"
                                                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    disabled={loading}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn(e as any)}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleEmailSignIn}
                                            className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20"
                                            disabled={loading || !email.includes('@')}
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <>Email Magic Link <ArrowRight className="ml-2 h-4 w-4" /></>}
                                        </Button>
                                    </TabsContent>
                                    )}
                                </Tabs>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/60 px-2 text-muted-foreground font-bold tracking-widest">Or Continue With</span></div>
                                </div>
                                </>)}

                                {showPhoneOrEmail ? (
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-3"
                                        onClick={() => handleSocialAuth('google')}
                                        disabled={loading}
                                    >
                                        <Chrome className="h-5 w-5 text-[#4285F4]" /> Continue with Google
                                    </Button>
                                ) : (
                                    // Google sign-in, collecting name, phone and newsletter choice first
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name">Name</Label>
                                            <Input
                                                id="signup-name"
                                                placeholder="Your full name"
                                                autoComplete="name"
                                                className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-phone">Phone Number</Label>
                                            <div className="relative flex">
                                                <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md border-white/10 bg-white/5 text-muted-foreground font-mono text-sm">
                                                    +91
                                                </div>
                                                <Input
                                                    id="signup-phone"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    autoComplete="tel-national"
                                                    placeholder="99999 99999"
                                                    className="flex-1 rounded-l-none h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-colors font-mono"
                                                    value={phoneNumber}
                                                    onChange={handlePhoneChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                        <label htmlFor="signup-newsletter" className="flex items-start gap-3 cursor-pointer select-none">
                                            <Checkbox
                                                id="signup-newsletter"
                                                checked={newsletterOptIn}
                                                onCheckedChange={(v) => setNewsletterOptIn(v === true)}
                                                disabled={loading}
                                                className="mt-0.5"
                                            />
                                            <span className="text-sm text-muted-foreground leading-snug">
                                                I agree to subscribe to the LASA newsletter
                                            </span>
                                        </label>
                                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                                            <p className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">Important disclaimer</p>
                                            <ul className="list-disc pl-4 space-y-1.5">
                                                <li>All information on this platform (screeners, levels, scores, summaries and charts) is generated by algorithms and AI models and is for <span className="text-foreground font-medium">educational and informational purposes only</span>.</li>
                                                <li>Nothing here is a recommendation to <span className="text-foreground font-medium">buy, sell or hold</span> any security. Make your own decisions, and consult a SEBI-registered investment adviser before investing.</li>
                                                <li>Investments in securities markets are subject to market risk. Past performance does not guarantee future results.</li>
                                                <li><span className="text-foreground font-medium">Lasa Research Services and Dheeraj Sogani are not responsible</span> for any losses arising from decisions made using this information.</li>
                                            </ul>
                                            <label htmlFor="signup-disclaimer" className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-amber-500/20">
                                                <Checkbox
                                                    id="signup-disclaimer"
                                                    checked={disclaimerAccepted}
                                                    onCheckedChange={(v) => setDisclaimerAccepted(v === true)}
                                                    disabled={loading}
                                                    className="mt-0.5"
                                                />
                                                <span className="text-sm text-foreground leading-snug">
                                                    I have read and agree to this disclaimer, the{' '}
                                                    <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                                                    <Link to="/sebi-compliance" className="text-primary hover:underline">Disclosures</Link>.
                                                </span>
                                            </label>
                                        </div>
                                        <Button
                                            className="w-full h-12 text-base font-bold gap-3 shadow-xl shadow-primary/20"
                                            onClick={() => handleSocialAuth('google', true)}
                                            disabled={loading || !signupDetailsValid || !disclaimerAccepted}
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <><Chrome className="h-5 w-5" /> Continue with Google</>}
                                        </Button>
                                        <p className="text-center text-sm text-muted-foreground">
                                            Already registered?{' '}
                                            <button
                                                type="button"
                                                className="font-semibold text-primary hover:underline disabled:opacity-50"
                                                onClick={() => handleSocialAuth('google')}
                                                disabled={loading || !disclaimerAccepted}
                                            >
                                                Sign in with Google
                                            </button>
                                        </p>
                                        {!disclaimerAccepted && (
                                            <p className="text-center text-xs text-amber-400/80">Please tick the disclaimer box above to continue.</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Step 2: OTP Entry ───────────────────────────── */}
                        {step === 'OTP' && (
                            <motion.div
                                key="otp-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <Label className="block text-center text-sm text-muted-foreground">
                                        Enter the 6-digit code
                                    </Label>
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    onClick={handleVerifyOtp}
                                    className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20"
                                    disabled={loading || otp.replace(/\s/g, '').length < 6}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Verify & Access Terminal'}
                                </Button>

                                <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('PHONE'); setOtp(''); }}
                                        className="hover:text-white transition-colors"
                                    >
                                        ← Change number
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                        className="hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 3: Email Sent ──────────────────────────── */}
                        {step === 'EMAIL_SENT' && (
                            <motion.div
                                key="email-sent-step"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 space-y-6"
                            >
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-primary/20">
                                    <Mail className="h-10 w-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold">Link Sent!</h4>
                                    <p className="text-muted-foreground">Click the link in your email to log in instantly. You can close this window.</p>
                                </div>
                                <Button variant="outline" className="w-full h-11 border-white/10" onClick={() => setStep('PHONE')}>
                                    Back to sign in
                                </Button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-white/5 pt-6">
                    <p className="text-xs text-muted-foreground text-center max-w-[300px]">
                        Your disclaimer acceptance is recorded with the date, time and IP address for compliance.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
