"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api-client";
import { Alert } from "./ui";
import PasswordInput from "./PasswordInput";

export default function BookingLookup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.patientLogin(email, password);
      router.push("/appointments");
      router.refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="patient-email" className="mb-2 block text-sm font-semibold text-gray-800">
          Email address
        </label>
        <input
          id="patient-email"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
        />
      </div>
      <div>
        <label htmlFor="patient-password" className="mb-2 block text-sm font-semibold text-gray-800">Password</label>
        <PasswordInput id="patient-password" required autoComplete="current-password" value={password} onChange={setPassword} />
      </div>
      {error && <Alert>{error}</Alert>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-gray-600">New to Morrow Care? <Link className="font-semibold text-emerald-800 underline" href="/sign-up">Create an account</Link></p>
    </form>
  );
}
