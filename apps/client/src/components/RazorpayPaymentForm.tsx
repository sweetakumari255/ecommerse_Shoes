"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShippingFormInputs } from "@repo/types";
import useCartStore from "@/stores/cartStore";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RazorpayPaymentForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const { cart, clearCart } = useCartStore();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Failed to load payment gateway. Check your internet connection.");
      setLoading(false);
      return;
    }

    const token = await getToken();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/create-checkout-session`,
      {
        method: "POST",
        body: JSON.stringify({ cart }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    ).then((r) => r.json());

    if (!res.orderId) {
      setError("Could not start payment. Please try again.");
      setLoading(false);
      return;
    }

    const options = {
      key: res.keyId,
      amount: res.amount,
      currency: res.currency,
      name: "Ecom Store",
      description: "Order Payment",
      order_id: res.orderId,
      prefill: {
        name: shippingForm.name,
        email: shippingForm.email,
        contact: shippingForm.phone,
      },
      handler: async (response: any) => {
        const token2 = await getToken();
        const verifyRes = await fetch(
          `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/verify-payment`,
          {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cart,
              email: shippingForm.email,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token2}`,
            },
          }
        ).then((r) => r.json());

        setLoading(false);

        if (verifyRes.verified) {
          clearCart();
          router.push("/orders");
        } else {
          setError("Payment verification failed.");
        }
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
      theme: { color: "#1f2937" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        disabled={loading}
        onClick={handlePay}
        className="w-full bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer"
      >
        {loading ? "Loading..." : "Pay with Razorpay"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default RazorpayPaymentForm;
