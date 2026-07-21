import Link from "next/link";
import { Suspense } from "react";

// Inner component that uses searchParams
async function ReturnContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }> | undefined;
}) {
  const session_id = (await searchParams)?.session_id;

  if (!session_id) {
    return <div>No session id found!</div>;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/${session_id}`
  );
  const data = await res.json();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Payment {data.status}</h1>
      <p>Payment status: {data.paymentStatus}</p>
      <Link href="/orders" className="text-blue-600 hover:underline">
        See your orders
      </Link>
    </div>
  );
}

// Main component with Suspense boundary
export default function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }> | undefined;
}) {
  return (
    <Suspense fallback={<div className="p-4">Loading payment details...</div>}>
      <ReturnContent searchParams={searchParams} />
    </Suspense>
  );
}