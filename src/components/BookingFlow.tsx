"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AppointmentDto | null>(null);
  const [copied, setCopied] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    api.patientSession()
      .then(({ email: accountEmail }) => setEmail(accountEmail ?? ""))
      .catch(() => setEmail(""))
      .finally(() => setSessionChecked(true));
  }, []);

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
      await navigator.clipboard.writeText(confirmed.reference);
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

  if (!sessionChecked) {
    return <div className="booking-card h-40 animate-pulse rounded-2xl border border-gray-200 bg-white" aria-label="Checking your account" />;
  }

  if (!email) {
    return (
      <section className="booking-card account-prompt">
        <div className="account-prompt-copy">
          <span className="account-prompt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 19 6v5.2c0 4.3-2.8 7.4-7 9.3-4.2-1.9-7-5-7-9.3V6l7-2.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div>
            <p className="eyebrow eyebrow-dark">PATIENT ACCOUNT</p>
            <h2>Sign in to book a visit</h2>
            <p>Your account keeps your appointment details together and private.</p>
          </div>
        </div>
        <div className="account-prompt-actions">
          <Link href="/booking" className="account-primary-action">Sign in</Link>
          <Link href="/sign-up" className="account-secondary-action">Create account</Link>
        </div>
      </section>
    );
  }

  if (confirmed) {
    return (
      <section className="confirmation-card rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-800" aria-hidden="true">
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-emerald-950">You’re all set</h2>
        <p className="mt-1 text-sm text-emerald-900/75">Your visit has been booked.</p>

        <dl className="mt-6 space-y-3 text-sm text-gray-800">
          <Row label="Doctor" value={confirmed.provider.name} />
          <Row label="Date" value={formatDate(confirmed.date)} />
          <Row
            label="Time"
            value={`${formatTime(confirmed.startTime)} – ${formatTime(confirmed.endTime)} IST`}
          />
          <Row label="Your name" value={confirmed.customerName} />
          <Row label="Email" value={confirmed.customerEmail} />
        </dl>

        <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Visit reference · save this to manage your visit
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="break-all text-sm font-semibold text-gray-900">{confirmed.reference}</code>
            <button
              type="button"
              onClick={copyId}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {copied ? "Copied" : "Copy reference"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/booking/${confirmed.reference}`}
            className="rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            View visit details
          </a>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Book another visit
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={`booking-flow grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 ${providerId ? "" : "booking-flow-no-provider"}`}>
      <div className={`booking-card rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 ${providerId ? "" : "col-span-full w-full"}`}>
      <div className="space-y-9">
      <section aria-labelledby="provider-heading">
        <StepHeading id="provider-heading" number="01">Choose your doctor</StepHeading>
        <p className="provider-prompt">Who would you like to see? Choose a doctor to explore available visit times.</p>
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
            No doctors are available right now.
          </p>
        ) : (
          <div className="provider-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <button
                type="button"
                key={provider.id}
                onClick={() => pickProvider(provider.id)}
                aria-pressed={providerId === provider.id}
                className={`provider-card flex min-h-[72px] items-center justify-between rounded-xl border p-4 text-left font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  providerId === provider.id
                    ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-900 hover:border-emerald-700 hover:bg-emerald-50/50"
                }`}
              >
                <span className="provider-identity"><span className="provider-avatar" aria-hidden="true">{provider.name.split(" ").slice(-2).map((part) => part[0]).join("")}</span><span><span className="provider-name">{provider.name}</span><span className="provider-specialty">30-minute visits</span></span></span>
                <span className="text-xs font-medium opacity-75">
                  {providerId === provider.id ? "Chosen" : "Choose"}
                </span>
              </button>
            ))}
          </div>
        )}
        {!providerId && providers.length > 0 && (
          <div className="provider-next-step mt-6 flex items-center gap-3 rounded-2xl border border-[#e7ebdf] bg-[#f4f6ee] px-4 py-4">
            <span className="provider-next-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e08b6c] text-white" aria-hidden="true">↗</span>
            <span className="provider-next-copy min-w-0"><strong className="block text-[11px] text-[#395847]">Up next</strong><small className="mt-1 block text-[10px] text-[#78877e]">Choose a date and time that work for you. No account needed.</small></span>
            <span className="provider-next-count ml-auto flex items-center gap-2">01 <i /> 02 <i /> 03</span>
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
            className="appointment-date rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
          <p className="mt-2 text-sm text-gray-500">
            Monday to Saturday, 10:00 AM–6:00 PM IST · 30-minute visits
          </p>
        </section>
      )}

      {providerId && (
        <section aria-labelledby="time-heading">
          <StepHeading id="time-heading" number="03">Choose a time</StepHeading>
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
                      className={`time-choice min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
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
          <StepHeading id="details-heading" number="04">Your contact details</StepHeading>
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950">
            {formatDate(date)} · {formatTime(selected.start)}–{formatTime(selected.end)} IST
          </p>
          <form onSubmit={submit} className="max-w-xl space-y-4">
            <div>
              <label htmlFor="customer-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Your name
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
                readOnly
                aria-describedby="customer-email-note"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
              <p id="customer-email-note" className="mt-1.5 text-xs text-gray-500">This is the email on your signed-in account.</p>
            </div>
            {formError && <Alert>{formError}</Alert>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Booking…" : "Confirm my visit"}
            </button>
          </form>
        </section>
      )}

      {!selected && formError && <Alert>{formError}</Alert>}
      </div>
      </div>

      {providerId && <aside className="summary-card rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4.5 9.5h15M5.5 5.5h13A1.5 1.5 0 0 1 20 7v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5Z" />
            </svg>
          </span>
          <div>
            <h2 className="font-semibold text-gray-950">Your visit</h2>
            <p className="text-xs text-gray-500">Your selections so far</p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-gray-100 text-sm">
          <SummaryRow label="Doctor" value={providers.find((provider) => provider.id === providerId)?.name ?? "Choose your doctor"} active={!providerId} />
          <SummaryRow label="Date" value={providerId ? formatDate(date) : "Choose a date"} active={Boolean(providerId)} />
          <SummaryRow label="Time" value={selected ? `${formatTime(selected.start)} – ${formatTime(selected.end)} IST` : "Choose a time"} active={Boolean(providerId) && !selected} />
          <SummaryRow label="Visit length" value="30 minutes" />
        </dl>

        <div className="mt-5 rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">A few simple steps</h3>
          <ol className="mt-3 space-y-2.5 text-xs leading-5 text-gray-600">
            <li className="flex gap-2"><span className="font-bold text-emerald-800">1</span> Choose a doctor, date and time.</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-800">2</span> Add your contact details.</li>
            <li className="flex gap-2"><span className="font-bold text-emerald-800">3</span> Keep your visit reference handy.</li>
          </ol>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-500">
          All appointment times are shown in India Standard Time (IST).
        </p>
      </aside>}
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
    <h2 id={id} className="step-heading mb-4 flex items-center gap-3 text-lg font-semibold text-gray-950">
      <span className="step-number flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
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

