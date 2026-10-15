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
  const [reloadKey, setReloadKey] = useState(0);
  const [referenceQuery, setReferenceQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<AppointmentDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    api
      .list()
      .then((response) => {
        if (active) setItems(response.appointments);
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh() {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  async function confirmCancel() {
    const appointment = pendingCancel;
    if (inFlight.current || !appointment) return;
    inFlight.current = true;
    setCancellingId(appointment.id);
    setActionError(null);
    setNotice(null);
    try {
      const response = await api.cancel(appointment.id);
      setItems((current) =>
        current.map((item) => (item.id === appointment.id ? response.appointment : item)),
      );
      setNotice(`${response.message} (${appointment.customerName})`);
      setPendingCancel(null);
    } catch (requestError) {
      setActionError(errorMessage(requestError));
      setPendingCancel(null);
    } finally {
      inFlight.current = false;
      setCancellingId(null);
    }
  }

  const normalizedReferenceQuery = referenceQuery.trim().toLowerCase().replace(/[\s-]/g, "");
  const filteredItems = items.filter((appointment) =>
    appointment.reference.toLowerCase().replace(/[\s-]/g, "").includes(normalizedReferenceQuery) &&
    (!dateQuery || appointment.date === dateQuery),
  );

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading appointments">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        {error.toLowerCase().includes("sign in") && (
          <Link href="/booking" className="inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Sign in to view your visits</Link>
        )}
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section aria-label="Search your visits" className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
        <div>
          <label htmlFor="visit-reference-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Visit reference</label>
          <input id="visit-reference-search" type="search" value={referenceQuery} onChange={(event) => setReferenceQuery(event.target.value)} placeholder="Search by reference" className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
        </div>
        <div>
          <label htmlFor="visit-date-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Visit date</label>
          <input id="visit-date-search" type="date" value={dateQuery} onChange={(event) => setDateQuery(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
        </div>
        <p className="text-xs text-gray-500 sm:col-span-2" aria-live="polite">Showing {filteredItems.length} of {items.length} {items.length === 1 ? "visit" : "visits"}</p>
      </section>

      {notice && <Notice>{notice}</Notice>}
      {actionError && <Alert>{actionError}</Alert>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <h2 className="font-semibold text-gray-900">No visits on the schedule yet</h2>
          <p className="mt-1 text-sm text-gray-500">Newly booked visits will appear here.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-gray-900">No visits match those filters</h2>
          <p className="mt-1 text-sm text-gray-500">Try another reference or choose a different date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-left text-sm">
            <caption className="sr-only">Your visits, newest first</caption>
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Doctor</th>
                <th scope="col" className="px-4 py-3">Visit reference</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Time (IST)</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((appointment) => {
                const cancelled = appointment.status === "CANCELLED";
                return (
                  <tr key={appointment.id} className={cancelled ? "bg-gray-50/70 text-gray-500" : "text-gray-800"}>
                    <td className="whitespace-nowrap px-4 py-4 font-medium">{appointment.provider.name}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <Link href={`/booking/${appointment.reference}`} className="font-mono text-xs font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950">
                        {appointment.reference}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">{formatDate(appointment.date)}</td>
                    <td className="whitespace-nowrap px-4 py-4">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <StatusBadge status={appointment.status} />
                        {!cancelled && (
                          <button
                            type="button"
                            onClick={() => setPendingCancel(appointment)}
                            disabled={cancellingId !== null}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                          >
                            {cancellingId === appointment.id ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel this visit?"
        description={pendingCancel
          ? `Cancel ${pendingCancel.customerName}’s visit with ${pendingCancel.provider.name} on ${formatDate(pendingCancel.date)} at ${formatTime(pendingCancel.startTime)} IST? It will remain in the visit history.`
          : "This visit will remain in the history."}
        confirmLabel="Yes, cancel visit"
        pending={cancellingId !== null}
        onCancel={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
