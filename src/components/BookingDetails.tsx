"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppointmentDto } from "@/lib/dto";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/format";
import { Alert, ConfirmDialog, Notice, Row, StatusBadge } from "./ui";

type State =
  | { kind: "loading" }
  | { kind: "notfound" }
  | { kind: "error"; message: string }
  | { kind: "ready"; id: string; appointment: AppointmentDto };

export default function BookingDetails({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    api
      .appointment(id)
      .then((response) => {
        if (active) setState({ kind: "ready", id, appointment: response.appointment });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 404) {
          setState({ kind: "notfound" });
        } else {
          setState({ kind: "error", message: errorMessage(error) });
        }
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  async function confirmCancel() {
    if (inFlight.current || state.kind !== "ready") return;

    inFlight.current = true;
    setCancelling(true);
    setActionError(null);
    setNotice(null);
    try {
      const response = await api.cancel(id);
      setState({ kind: "ready", id, appointment: response.appointment });
      setNotice(response.message);
      setConfirmOpen(false);
    } catch (error) {
      setActionError(errorMessage(error));
      setConfirmOpen(false);
    } finally {
      inFlight.current = false;
      setCancelling(false);
    }
  }

  if (state.kind === "loading" || (state.kind === "ready" && state.id !== id)) {
    return <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white" aria-label="Loading booking" />;
  }

  if (state.kind === "notfound") {
    return (
      <div className="space-y-4">
        <Alert>No visit was found with that reference. Check the number and try again.</Alert>
        <Link href="/booking" className="inline-flex text-sm font-semibold text-emerald-800 underline underline-offset-4">
          Enter another reference
        </Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-4">
        <Alert>{state.message}</Alert>
        {state.message.toLowerCase().includes("sign in") && (
          <Link href="/booking" className="inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Sign in to manage this visit</Link>
        )}
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const appointment = state.appointment;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">YOUR VISIT</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">Visit details</h2>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <dl className="mt-6 space-y-4 border-y border-gray-100 py-5 text-sm">
        <Row label="Doctor" value={appointment.provider.name} />
        <Row label="Date" value={formatDate(appointment.date)} />
        <Row label="Time" value={`${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)} IST`} />
        <Row label="Your name" value={appointment.customerName} />
        <Row label="Contact email" value={appointment.customerEmail} />
      </dl>
      <p className="mt-4 text-xs text-gray-500">Visit reference: <span className="font-mono font-semibold text-gray-700">{appointment.reference}</span></p>

      {notice && <div className="mt-5"><Notice>{notice}</Notice></div>}
      {actionError && <div className="mt-5"><Alert>{actionError}</Alert></div>}

      <div className="mt-6 flex flex-wrap gap-3">
        {appointment.status === "BOOKED" ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={cancelling}
            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel this visit"}
          </button>
        ) : (
          <Link href="/" className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
            Book another visit
          </Link>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this visit?"
        description={`You’re cancelling your visit with ${appointment.provider.name} on ${formatDate(appointment.date)} at ${formatTime(appointment.startTime)} IST. You can book another time whenever you’re ready.`}
        confirmLabel="Yes, cancel my visit"
        pending={cancelling}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmCancel}
      />
    </section>
  );
}
