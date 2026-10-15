import AppointmentsTable from "@/components/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Management</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">All appointments</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          Review booking history and manage upcoming appointments. Cancelled appointments remain in the list.
        </p>
      </header>
      <AppointmentsTable />
    </main>
  );
}
