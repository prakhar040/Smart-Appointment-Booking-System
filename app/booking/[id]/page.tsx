import { Suspense } from "react";
import BookingDetails from "@/components/BookingDetails";

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Manage a booking</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">Your appointment</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Review the details or cancel this appointment.</p>
      </header>
      <Suspense fallback={<div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white" aria-label="Loading booking" />}>
        <BookingDetailsContent params={params} />
      </Suspense>
    </main>
  );
}

async function BookingDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetails key={id} id={id} />;
}
