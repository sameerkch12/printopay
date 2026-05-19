export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-secondary">
      {text}
    </div>
  );
}
