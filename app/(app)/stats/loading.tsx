function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bone className="w-7 h-7 rounded-full" />
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-4 w-12" />
      </div>
      <Bone className="h-2.5 w-full rounded-full" />
    </div>
  );
}

export default function StatsLoading() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Bone className="h-9 w-48" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>

      {[1, 2, 3, 4].map((section) => (
        <div key={section} className="mb-8">
          <Bone className="h-3 w-32 mb-3 rounded-full" />
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
