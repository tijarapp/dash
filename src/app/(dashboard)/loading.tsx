export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1800px] space-y-6" role="status" aria-label="جارٍ تحميل لوحة التحكم">
      <span className="sr-only">جارٍ تحميل البيانات…</span>
      <div className="space-y-3 pb-2" aria-hidden="true">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-stone-200/70" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-stone-200/60" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-2xl bg-white p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
            <div className="h-8 w-20 animate-pulse rounded bg-stone-100" />
            <div className="h-7 w-3/4 animate-pulse rounded bg-stone-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-2xl bg-white" />)}
      </div>
    </div>
  );
}
