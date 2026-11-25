export function BackgroundGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)',
        }}
      />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/20 blur-3xl rounded-full" />
      <div className="absolute top-40 -left-20 w-[300px] h-[300px] bg-cyan-500/10 blur-3xl rounded-full" />
      <div className="absolute top-20 -right-20 w-[300px] h-[300px] bg-fuchsia-500/10 blur-3xl rounded-full" />
    </div>
  )
}
