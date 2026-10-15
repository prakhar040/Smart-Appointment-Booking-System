import PatientSignup from "@/components/PatientSignup";

export default function SignupPage() {
  return (
    <main className="subpage-shell">
      <header className="subpage-hero">
        <p className="eyebrow eyebrow-dark">YOUR CARE, IN ONE PLACE</p>
        <h1>Create your patient account.</h1>
        <p>Use your account to book visits and manage only your appointments.</p>
      </header>
      <section className="subpage-card"><PatientSignup /></section>
    </main>
  );
}
