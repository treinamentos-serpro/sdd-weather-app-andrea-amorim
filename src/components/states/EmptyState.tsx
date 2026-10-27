import { useId } from 'react';

interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhuma cidade encontrada',
  hint = 'Verifique o nome da cidade ou tente buscar outra localização.',
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <div
      role="status"
      aria-labelledby={headingId}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md"
    >
      <h2 id={headingId} className="break-words text-xl font-semibold">
        {title}
      </h2>
      <p className="mt-2 break-words text-slate-300">{hint}</p>
    </div>
  );
}
