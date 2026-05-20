export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(9,9,15,0.92)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[1.5rem] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="modal-label">{title}</p>
          </div>
          <button
            className="rounded-full border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
