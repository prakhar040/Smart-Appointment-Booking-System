import AppointmentsTable from "@/components/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <main className="subpage-shell subpage-wide">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">THE CLINIC DESK</p>
        <h1>Every visit, in one place.</h1>
        <p>
          Review upcoming and past visits. Cancelled visits remain in the clinic history.
        </p>
      </header>
      <AppointmentsTable />
    </main>
  );
}
