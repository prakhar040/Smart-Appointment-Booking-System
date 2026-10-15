import BookingLookup from "@/components/BookingLookup";

export default function BookingPage() {
  return (
    <main className="subpage-shell">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">YOUR VISIT, AT YOUR FINGERTIPS</p>
        <h1>Pick up where you left off.</h1>
        <p>
          Enter the visit reference from your confirmation to review the details or cancel your appointment.
        </p>
      </header>
      <section className="subpage-card">
        <BookingLookup />
      </section>
    </main>
  );
}
