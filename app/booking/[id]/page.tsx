import BookingDetails from "@/components/BookingDetails";
import { Suspense } from "react";

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="subpage-shell">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">VISIT MANAGEMENT</p>
        <h1>Manage your visit.</h1>
        <p>Review your booking details or cancel the appointment.</p>
      </header>
      <Suspense
        fallback={
          <section
            aria-label="Loading visit details"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />
          </section>
        }
      >
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
