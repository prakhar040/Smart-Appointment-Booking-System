"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api-client";
import { Alert } from "./ui";
import PasswordInput from "./PasswordInput";

export default function PatientSignup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError("Those passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.patientSignup(email, password);
      router.push("/");
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
        <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-gray-800">Email address</label>
        <input id="signup-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-gray-800">Create password</label>
        <PasswordInput id="signup-password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={setPassword} />
        <p className="mt-1.5 text-xs text-gray-500">Use at least 12 characters.</p>
      </div>
      <div>
        <label htmlFor="signup-confirm" className="mb-2 block text-sm font-semibold text-gray-800">Confirm password</label>
        <PasswordInput id="signup-confirm" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} onChange={setConfirmation} />
      </div>
      {error && <Alert>{error}</Alert>}
      <button type="submit" disabled={loading} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button>
      <p className="text-sm text-gray-600">Already have an account? <Link className="font-semibold text-emerald-800 underline" href="/booking">Sign in</Link></p>
    </form>
  );
}
