type AuthErrorPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const message = params.message || "No se pudo iniciar sesion con Google.";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Autenticacion</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">No se pudo completar el acceso</h1>
        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
