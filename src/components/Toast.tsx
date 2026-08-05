interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-lg bg-[#111b2c] px-4 py-3 text-sm text-white shadow-2xl transition ${message ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
