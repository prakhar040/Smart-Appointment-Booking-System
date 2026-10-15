import { useEffect, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {children}
    </p>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {children}
    </p>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export function StatusBadge({ status }: { status: "BOOKED" | "CANCELLED" }) {
  const label = status === "BOOKED" ? "Booked" : "Cancelled";
  const style = status === "BOOKED" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!pending) onCancel();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !pending) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-gray-950/55 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6 sm:p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 id="confirm-dialog-title" className="mt-4 text-lg font-semibold text-gray-950">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-gray-600">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={pending}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 disabled:opacity-50"
          >
            Keep this visit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Cancelling…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
