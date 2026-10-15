import AppointmentsTable from "@/components/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <main className="subpage-shell subpage-wide">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">APPOINTMENT MANAGEMENT</p>
        <h1>All appointments.</h1>
        <p>
          Review bookings and update their status when plans change.
        </p>
      </header>
      <AppointmentsTable />
    </main>
  );
}
