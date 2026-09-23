import { getApiUrl } from "@/config/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptLoadingPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error("Could not load the Razorpay checkout script. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export type BillingCycle = "quarterly" | "annual";

interface CheckoutUser {
  uid?: string;
  email?: string | null;
  phoneNumber?: string | null;
}

interface StartCheckoutParams {
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  user: CheckoutUser | null;
  onSuccess: (result: { tier: string; planName: string }) => void;
  onError: (message: string) => void;
  onDismiss?: () => void;
}

/** Creates a Razorpay order via the backend, opens the Standard Checkout modal,
 *  and verifies the payment signature server-side on success. */
export async function startRazorpayCheckout({
  planId,
  planName,
  billingCycle,
  user,
  onSuccess,
  onError,
  onDismiss,
}: StartCheckoutParams) {
  try {
    await loadRazorpayScript();

    const orderRes = await fetch(getApiUrl("/api/razorpay/create-order"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        billingCycle,
        userId: user?.uid,
        userEmail: user?.email || undefined,
        userPhone: user?.phoneNumber || undefined,
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.success) {
      throw new Error(orderData.error || "Could not start checkout. Please try again.");
    }

    if (orderData.free) {
      onSuccess({ tier: "free", planName });
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Lasa Research Services",
      description: `${planName} — ${billingCycle === "annual" ? "Annual" : "Quarterly"} Subscription`,
      order_id: orderData.orderId,
      prefill: {
        email: user?.email || "",
        contact: user?.phoneNumber || "",
      },
      theme: { color: "#6366f1" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch(getApiUrl("/api/razorpay/verify-payment"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              billingCycle,
              userId: user?.uid,
              userEmail: user?.email || undefined,
              userPhone: user?.phoneNumber || undefined,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || "Payment verification failed. Contact support if you were charged.");
          }
          onSuccess({ tier: verifyData.tier, planName: verifyData.planName || planName });
        } catch (err) {
          onError(err instanceof Error ? err.message : "Payment verification failed.");
        }
      },
      modal: {
        ondismiss: () => onDismiss?.(),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
      onError(response.error?.description || "Payment failed. Please try again.");
    });
    rzp.open();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
  }
}
