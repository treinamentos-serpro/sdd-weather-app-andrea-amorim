import { useId } from 'react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const headingId = useId();

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md">
      <div role="alert" aria-labelledby={headingId}>
        <h2 id={headingId} className="text-xl font-semibold text-red-300">
          Não foi possível consultar os dados
        </h2>
        <p className="mt-2 break-words text-slate-200">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => onRetry()}
        className="mt-4 rounded-xl bg-accent-500 px-5 py-3 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
      >
        Tentar novamente
      </button>
    </div>
  );
}
