import BookingLookup from "@/components/BookingLookup";

export default function BookingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Manage a booking</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">Find your appointment</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
          Enter the booking ID from your confirmation to view the details or cancel.
        </p>
      </header>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <BookingLookup />
      </section>
    </main>
  );
}
