export default function Loading() {
  return (
    <div className="container-page py-16" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-6 h-12 w-full max-w-2xl" />
      <div className="skeleton mt-4 h-5 w-full max-w-xl" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
      </div>
    </div>
  );
}
