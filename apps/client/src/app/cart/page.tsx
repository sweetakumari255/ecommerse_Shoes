import { Suspense } from "react";
import CartPageClient from "./CartPageClient";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <CartPageClient />
    </Suspense>
  );
}
