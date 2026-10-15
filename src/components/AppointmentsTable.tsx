"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppointmentDto } from "@/lib/dto";
import { api, errorMessage } from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/format";
import { Alert, ConfirmDialog, Notice, StatusBadge } from "./ui";

export default function AppointmentsTable() {
  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<AppointmentDto | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    api.list()
      .then(({ appointments }) => {
        if (active) setItems(appointments);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function cancel() {
    if (!pendingCancel || inFlight.current) return;
    inFlight.current = true;
    setCancelling(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.cancel(pendingCancel.reference);
      setItems((current) => current.map((item) =>
        item.id === pendingCancel.id ? result.appointment : item,
      ));
      setNotice(result.message);
      setPendingCancel(null);
    } catch (reason) {
      setError(errorMessage(reason));
      setPendingCancel(null);
    } finally {
      inFlight.current = false;
      setCancelling(false);
    }
  }

  return (
    <section aria-label="Appointment management" className="space-y-4">
      {notice && <Notice>{notice}</Notice>}
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <div className="space-y-3" aria-label="Loading appointments">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <h2 className="font-semibold text-gray-900">No appointments yet</h2>
          <p className="mt-1 text-sm text-gray-500">New bookings will appear here.</p>
          <Link href="/" className="mt-4 inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Book an appointment</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <caption className="sr-only">All appointments, newest first</caption>
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Doctor</th>
                <th scope="col" className="px-4 py-3">Patient</th>
                <th scope="col" className="px-4 py-3">Reference ID</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Time (IST)</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((appointment) => (
                <tr key={appointment.id} className={appointment.status === "CANCELLED" ? "bg-gray-50/70 text-gray-500" : "text-gray-800"}>
                  <td className="whitespace-nowrap px-4 py-4 font-medium">{appointment.provider.name}</td>
                  <td className="px-4 py-4">
                    <span className="block font-medium">{appointment.customerName}</span>
                    <span className="text-xs text-gray-500">{appointment.customerEmail}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <Link
                      href={`/booking/${appointment.reference}`}
                      className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    >
                      {appointment.reference}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">{formatDate(appointment.date)}</td>
                  <td className="whitespace-nowrap px-4 py-4">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</td>
                  <td className="px-4 py-4"><StatusBadge status={appointment.status} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    {appointment.status === "BOOKED" && (
                      <button
                        type="button"
                        onClick={() => setPendingCancel(appointment)}
                        disabled={cancelling}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel this appointment?"
        description={pendingCancel
          ? `Cancel ${pendingCancel.customerName}’s appointment with ${pendingCancel.provider.name} on ${formatDate(pendingCancel.date)} at ${formatTime(pendingCancel.startTime)} IST?`
          : "The cancelled appointment will remain in the list."}
        confirmLabel="Yes, cancel appointment"
        pending={cancelling}
        onCancel={() => setPendingCancel(null)}
        onConfirm={cancel}
      />
    </section>
  );
}
