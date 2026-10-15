import { Suspense } from "react";
import BookingDetails from "@/components/BookingDetails";

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="subpage-shell">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">YOUR VISIT, AT YOUR FINGERTIPS</p>
        <h1>Your visit.</h1>
        <p>Review your visit details or cancel if your plans change.</p>
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
