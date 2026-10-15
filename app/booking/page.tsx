import BookingLookup from "@/components/BookingLookup";

export default function BookingPage() {
  return (
    <main className="subpage-shell">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">WELCOME BACK</p>
        <h1>Sign in to your account.</h1>
        <p>View your appointments, manage your visits, and book your next appointment.</p>
      </header>
      <section className="subpage-card">
        <BookingLookup />
      </section>
    </main>
  );
}
