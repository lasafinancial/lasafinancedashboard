// TEMPORARY stub so the real screens render with no Firebase/Firestore access. Delete after use.
export const useAuth = () => ({ user: { uid: "verify-stub" }, userData: { tier: "elite", name: "Verify" }, loading: false, isFree: false, isPro: true, isElite: true, updateUserData: async () => {}, logout: async () => {} });
export const AuthProvider = ({ children }: { children: any }) => children;
