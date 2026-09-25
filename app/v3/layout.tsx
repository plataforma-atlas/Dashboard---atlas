import V3Sidebar from "@/components/v3/V3Sidebar";
import V3Topbar from "@/components/v3/V3Topbar";

// Shell de la V3: solo chrome (sidebar + topbar + main). Cada página hija
// resuelve su propia sesión/datos — ver plan en purrfect-humming-backus.md.
// No tocar los layouts/paginas existentes fuera de /v3.
export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <V3Sidebar />
      <main className="min-h-screen flex-1 md:ml-[var(--sidebar-w,240px)] transition-[margin] duration-200">
        <V3Topbar />
        {children}
      </main>
    </div>
  );
}
