import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[18rem_1fr]">
        <Sidebar />
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
