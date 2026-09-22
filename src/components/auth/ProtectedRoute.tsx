import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** When true, lets anonymous visitors view the page (guest browsing). The LoginNudgeModal
     *  still prompts them to sign in with Google after a few minutes. Routes that must always
     *  require a real account (e.g. /admin) leave this false. */
    allowAnonymous?: boolean;
}

export const ProtectedRoute = ({ children, allowAnonymous = false }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user && !allowAnonymous) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
