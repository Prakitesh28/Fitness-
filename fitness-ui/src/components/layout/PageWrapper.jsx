import Navbar from './Navbar';
export default function PageWrapper({ children }) { return <div><Navbar /><main className="mx-auto max-w-7xl p-4">{children}</main></div>; }
