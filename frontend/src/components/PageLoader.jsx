export default function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-royal-light border-t-royal" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
