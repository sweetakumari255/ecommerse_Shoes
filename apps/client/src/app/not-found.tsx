echo 'import { Suspense } from "react";
import Link from "next/link";

function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-6 text-center">
        Oops! The page you'\''re looking for doesn'\''t exist.
      </p>
      <Link
        href="/"
        className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}' > not-found.tsx