export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">
        ∅
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
