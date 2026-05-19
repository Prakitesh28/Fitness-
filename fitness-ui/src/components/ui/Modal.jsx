export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-4 dark:bg-slate-900"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><button onClick={onClose}>x</button></div>{children}</div></div>;
}
