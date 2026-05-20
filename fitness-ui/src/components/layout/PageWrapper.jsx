import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <Navbar onToggleSidebar={(open) => setSidebarOpen(Boolean(open))} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[18rem_1fr]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="page-content space-y-6">{children}</main>
      </div>
    </div>
  );
}
