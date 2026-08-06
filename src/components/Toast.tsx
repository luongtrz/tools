interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-md bg-foreground px-4 py-3 text-sm text-background shadow-2xl transition ${message ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
