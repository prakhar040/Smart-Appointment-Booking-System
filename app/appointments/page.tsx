import AppointmentsTable from "@/components/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <main className="subpage-shell subpage-wide">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">YOUR CARE, IN ONE PLACE</p>
        <h1>Your appointments.</h1>
        <p>
          Review upcoming and past visits linked to your patient account.
        </p>
      </header>
      <AppointmentsTable />
    </main>
  );
}
