import type { WithdrawRow } from '@/lib/data';

function DetailCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-medium ${mono ? 'break-all font-mono text-sm' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function WithdrawDetailsGrid({ request }: { request: WithdrawRow }) {
  if (request.method === 'zaincash') {
    return (
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <DetailCell label="صاحب المحفظة" value={request.holderName} />
        <DetailCell label="رقم المحفظة" value={request.phoneNumber} mono />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <DetailCell label="صاحب البطاقة" value={request.cardHolder} />
      <DetailCell label="رقم البطاقة" value={request.cardNumber} mono />
      {request.swift ? (
        <div className="sm:col-span-2">
          <DetailCell label="SWIFT" value={request.swift} mono />
        </div>
      ) : null}
    </div>
  );
}
