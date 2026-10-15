import BookingFlow from "@/components/BookingFlow";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 text-gray-900 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-6 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
            Appointment care
        </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Book an appointment
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Choose a provider, a date and a time that works for you. No account needed.
          </p>
        </div>
        <p className="text-sm font-medium text-gray-500">Monday–Saturday <span className="mx-1 text-gray-300">·</span> 10 AM–6 PM IST</p>
      </header>
      <Suspense
        fallback={
          <div className="min-h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" aria-label="Loading booking form" />
        }
      >
        <BookingFlow />
      </Suspense>
    </main>
  );
}
