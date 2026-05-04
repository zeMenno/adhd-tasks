function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
}

export default function TodayLoading() {
  return (
    <>
      <Bone className="h-9 w-44 mb-4" />

      {/* Leaderboard pills */}
      <div className="flex gap-2 mb-6">
        <Bone className="h-8 w-28 rounded-full" />
        <Bone className="h-8 w-28 rounded-full" />
      </div>

      {/* Task card skeletons */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Bone key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </>
  );
}
