"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BookingLookup() {
  const router = useRouter();
  const [id, setId] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = id.trim();
    if (value) router.push(`/booking/${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="booking-id" className="mb-2 block text-sm font-semibold text-gray-800">
          Booking ID
        </label>
        <input
          id="booking-id"
          required
          autoComplete="off"
          placeholder="Paste the ID from your confirmation"
          value={id}
          onChange={(event) => setId(event.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 placeholder:font-sans placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
        />
        <p className="mt-2 text-xs leading-5 text-gray-500">
          Your booking ID was shown after you confirmed your appointment.
        </p>
      </div>
      <button
        type="submit"
        className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
      >
        Find booking
      </button>
    </form>
  );
}
