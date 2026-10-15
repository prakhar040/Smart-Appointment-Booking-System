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
  | { kind: "ready"; appointment: AppointmentDto };

export default function BookingDetails({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    api.appointment(id)
      .then(({ appointment }) => {
        if (active) setState({ kind: "ready", appointment });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof ApiClientError && reason.status === 404) setState({ kind: "notfound" });
        else setState({ kind: "error", message: errorMessage(reason) });
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  async function cancel() {
    if (state.kind !== "ready" || inFlight.current) return;
    inFlight.current = true;
    setCancelling(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.cancel(state.appointment.reference);
      setState({ kind: "ready", appointment: result.appointment });
      setNotice(result.message);
      setConfirmOpen(false);
    } catch (reason) {
      setError(errorMessage(reason));
      setConfirmOpen(false);
    } finally {
      inFlight.current = false;
      setCancelling(false);
    }
  }

  if (state.kind === "loading") {
    return <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white" aria-label="Loading appointment" />;
  }
  if (state.kind === "notfound") {
    return <div className="space-y-4"><Alert>No appointment was found with that booking ID.</Alert><Link href="/appointments" className="font-semibold text-emerald-800 underline underline-offset-4">Back to all appointments</Link></div>;
  }
  if (state.kind === "error") {
    return <div className="space-y-4"><Alert>{state.message}</Alert><button type="button" onClick={() => { setState({ kind: "loading" }); setReloadKey((key) => key + 1); }} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Try again</button></div>;
  }

  const appointment = state.appointment;
  return (
    <section className="subpage-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow eyebrow-dark">BOOKING ID</p>
          <h2 className="mt-1 font-mono text-lg font-semibold text-gray-900">{appointment.reference}</h2>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <dl className="mt-6 space-y-4 border-y border-gray-100 py-5 text-sm">
        <Row label="Doctor" value={appointment.provider.name} />
        <Row label="Patient" value={appointment.customerName} />
        <Row label="Email" value={appointment.customerEmail} />
        <Row label="Date" value={formatDate(appointment.date)} />
        <Row label="Time" value={`${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)} IST`} />
      </dl>
      {notice && <div className="mt-5"><Notice>{notice}</Notice></div>}
      {error && <div className="mt-5"><Alert>{error}</Alert></div>}
      <div className="mt-6 flex flex-wrap gap-3">
        {appointment.status === "BOOKED" && <button type="button" onClick={() => setConfirmOpen(true)} disabled={cancelling} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Cancel appointment</button>}
        <Link href="/appointments" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">All appointments</Link>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this appointment?"
        description={`Cancel your appointment with ${appointment.provider.name} on ${formatDate(appointment.date)} at ${formatTime(appointment.startTime)} IST?`}
        confirmLabel="Yes, cancel appointment"
        pending={cancelling}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={cancel}
      />
    </section>
  );
}
