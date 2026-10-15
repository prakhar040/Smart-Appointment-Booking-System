"use client";

import { use, useEffect, useRef, useState } from "react";
import { io } from "next/cache";
import type { AppointmentDto } from "@/lib/dto";
import { api, ApiClientError, errorMessage, type ProviderDto, type SlotsResponse } from "@/lib/api-client";
import { Alert, Row } from "./ui";
import {
  formatDate,
  formatTime,
  isSunday,
  nextWorkingDay,
  todayIST,
} from "@/lib/format";

type Slot = SlotsResponse["slots"][number];

export default function BookingFlow() {
  use(io());

  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [providerId, setProviderId] = useState<string | null>(null);
  const [date, setDate] = useState(() => nextWorkingDay(todayIST()));
  const [selected, setSelected] = useState<Slot | null>(null);

  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AppointmentDto | null>(null);
  const [copied, setCopied] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    api
      .providers()
      .then((response) => {
        if (active) setProviders(response.providers);
      })
      .catch((error: unknown) => {
        if (active) setProvidersError(errorMessage(error));
      })
      .finally(() => {
        if (active) setProvidersLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!providerId || !date) return;
    let active = true;
    api
      .slots(providerId, date)
      .then((response) => {
        if (active) setSlots(response);
      })
      .catch((error: unknown) => {
        if (active) {
          setSlots(null);
          setSlotsError(errorMessage(error));
        }
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [providerId, date, reloadKey]);

  function pickProvider(id: string) {
    setProviderId(id);
    setSelected(null);
    setFormError(null);
    setSlotsLoading(true);
    setSlotsError(null);
  }

  function pickDate(value: string) {
    if (!value) return;
    setDate(value);
    setSelected(null);
    setFormError(null);
    setSlotsLoading(true);
    setSlotsError(null);
  }

  function refreshSlots() {
    setSlotsLoading(true);
    setSlotsError(null);
    setReloadKey((key) => key + 1);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !providerId || !selected) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);

    try {
      const { appointment } = await api.book({
        providerId,
        customerName: name,
        customerEmail: email,
        startTime: selected.start,
      });
      setConfirmed(appointment);
    } catch (error) {
      setFormError(errorMessage(error));
      if (error instanceof ApiClientError && error.status === 409) {
        setSelected(null);
        refreshSlots();
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  async function copyId() {
    if (!confirmed) return;
    try {
      await navigator.clipboard.writeText(confirmed.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The booking ID remains visible if clipboard access is unavailable.
    }
  }

  function reset() {
    setConfirmed(null);
    setSelected(null);
    setName("");
    setEmail("");
    setFormError(null);
    refreshSlots();
  }

  if (confirmed) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-800" aria-hidden="true">
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-emerald-950">Booking confirmed</h2>
        <p className="mt-1 text-sm text-emerald-900/75">Your appointment is in the calendar.</p>

        <dl className="mt-6 space-y-3 text-sm text-gray-800">
          <Row label="Provider" value={confirmed.provider.name} />
          <Row label="Date" value={formatDate(confirmed.date)} />
          <Row
            label="Time"
            value={`${formatTime(confirmed.startTime)} – ${formatTime(confirmed.endTime)} IST`}
          />
          <Row label="Name" value={confirmed.customerName} />
          <Row label="Email" value={confirmed.customerEmail} />
        </dl>

        <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Booking ID · keep this to view or cancel
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="break-all text-sm font-semibold text-gray-900">{confirmed.id}</code>
            <button
              type="button"
              onClick={copyId}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/booking/${confirmed.id}`}
            className="rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            View booking
          </a>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Book another
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="space-y-9">
      <section aria-labelledby="provider-heading">
        <StepHeading id="provider-heading" number="01">Choose a provider</StepHeading>
        {providersLoading ? (
          <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading providers">
            <div className="h-[72px] animate-pulse rounded-xl bg-gray-100" />
            <div className="h-[72px] animate-pulse rounded-xl bg-gray-100" />
          </div>
        ) : providersError ? (
          <div className="space-y-3">
            <Alert>{providersError}</Alert>
            <button
              type="button"
                onClick={() => {
                setProvidersLoading(true);
                setProvidersError(null);
                api.providers()
                  .then((response) => setProviders(response.providers))
                  .catch((error: unknown) => setProvidersError(errorMessage(error)))
                  .finally(() => setProvidersLoading(false));
              }}
              className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        ) : providers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">
            No providers are available right now.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {providers.map((provider) => (
              <button
                type="button"
                key={provider.id}
                onClick={() => pickProvider(provider.id)}
                aria-pressed={providerId === provider.id}
                className={`flex min-h-[72px] items-center justify-between rounded-xl border p-4 text-left font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  providerId === provider.id
                    ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-900 hover:border-emerald-700 hover:bg-emerald-50/50"
                }`}
              >
                <span>{provider.name}</span>
                <span className="text-xs font-medium opacity-75">
                  {providerId === provider.id ? "Selected" : "Select"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {providerId && (
        <section aria-labelledby="date-heading">
          <StepHeading id="date-heading" number="02">Choose a date</StepHeading>
          <label className="sr-only" htmlFor="appointment-date">Appointment date</label>
          <input
            id="appointment-date"
            type="date"
            value={date}
            min={todayIST()}
            onChange={(event) => pickDate(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
          <p className="mt-2 text-sm text-gray-500">
            Monday to Saturday, 10:00 AM–6:00 PM IST · 30-minute appointments
          </p>
        </section>
      )}

      {providerId && (
        <section aria-labelledby="time-heading">
          <StepHeading id="time-heading" number="03">Select a time</StepHeading>
          {slotsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Loading appointment times">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : slotsError ? (
            <div className="space-y-3">
              <Alert>{slotsError}</Alert>
              <button
                type="button"
                onClick={refreshSlots}
                className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
              >
                Retry loading times
              </button>
            </div>
          ) : slots?.closed || isSunday(date) ? (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              The clinic is closed on Sundays. Please choose another date.
            </p>
          ) : slots && slots.slots.every((slot) => !slot.available) ? (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              No times are available on this date. Please choose another date.
            </p>
          ) : slots ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.slots.map((slot) => {
                  const isSelected = selected?.start === slot.start;
                  return (
                    <button
                      type="button"
                      key={slot.start}
                      disabled={!slot.available}
                      onClick={() => {
                        setSelected(slot);
                        setFormError(null);
                      }}
                      aria-pressed={isSelected}
                      title={slot.reason === "BOOKED" ? "Already booked" : slot.reason === "PAST" ? "In the past" : undefined}
                      className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                        isSelected
                          ? "border-emerald-800 bg-emerald-800 text-white"
                          : slot.available
                            ? "border-gray-200 bg-white text-gray-900 hover:border-emerald-700 hover:bg-emerald-50"
                            : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 line-through"
                      }`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Disabled times are booked or have already passed.
              </p>
            </>
          ) : null}
        </section>
      )}

      {selected && (
        <section aria-labelledby="details-heading">
          <StepHeading id="details-heading" number="04">Your details</StepHeading>
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950">
            {formatDate(date)} · {formatTime(selected.start)}–{formatTime(selected.end)} IST
          </p>
          <form onSubmit={submit} className="max-w-xl space-y-4">
            <div>
              <label htmlFor="customer-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="customer-name"
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label htmlFor="customer-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="customer-email"
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            {formError && <Alert>{formError}</Alert>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Booking…" : "Confirm appointment"}
            </button>
          </form>
        </section>
      )}

      {!selected && formError && <Alert>{formError}</Alert>}
      </div>
      </div>

      <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4.5 9.5h15M5.5 5.5h13A1.5 1.5 0 0 1 20 7v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5Z" />
            </svg>
          </span>
          <div>
            <h2 className="font-semibold text-gray-950">Your appointment</h2>
            <p className="text-xs text-gray-500">Booking summary</p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-gray-100 text-sm">
          <SummaryRow label="Provider" value={providers.find((provider) => provider.id === providerId)?.name ?? "Choose a provider"} active={!providerId} />
          <SummaryRow label="Date" value={providerId ? formatDate(date) : "Choose a date"} active={Boolean(providerId)} />
          <SummaryRow label="Time" value={selected ? `${formatTime(selected.start)} – ${formatTime(selected.end)} IST` : "Choose a time"} active={Boolean(providerId) && !selected} />
          <SummaryRow label="Duration" value="30 minutes" />
        </dl>

        <div className="mt-5 rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">How booking works</h3>
          <ol className="mt-3 space-y-2.5 text-xs leading-5 text-gray-600">
            <li className="flex gap-2"><span className="font-bold text-emerald-800">1</span> Pick a provider, date and available time.</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-800">2</span> Add your name and email to confirm.</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-800">3</span> Save your booking ID for later.</li>
          </ol>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-500">
          All appointment times are shown in India Standard Time (IST).
        </p>
      </aside>
    </div>
  );
}

function StepHeading({
  id,
  number,
  children,
}: {
  id: string;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-3 text-lg font-semibold text-gray-950">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
        {number}
      </span>
      {children}
    </h2>
  );
}

function SummaryRow({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`mt-1 font-medium ${active ? "text-gray-400" : "text-gray-900"}`}>
        {value}
      </dd>
    </div>
  );
}

