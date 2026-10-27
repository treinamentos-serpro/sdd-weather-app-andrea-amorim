export default function LoadingState() {
  return (
    <div
      role="status"
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-glass backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20 border-t-accent-400 motion-safe:animate-spin"
      />
      <p>Carregando dados meteorológicos...</p>
    </div>
  );
}
