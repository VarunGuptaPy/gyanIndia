export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton mt-6 h-80 rounded-2xl" />
    </div>
  );
}
