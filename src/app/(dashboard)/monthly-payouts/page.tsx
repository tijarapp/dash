import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import NavAnchor from '@/components/NavAnchor';
import MonthlyPayoutForm from '@/components/MonthlyPayoutForm';
import { listMonthlyPayouts } from '@/lib/monthlyPayouts';
import { listUsers } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Customer = { name: string; phone: string };

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-IQ', { timeZone: 'Asia/Gaza', day: 'numeric', month: 'long', year: 'numeric' });

export default async function MonthlyPayoutsPage() {
  const [rows, users] = await Promise.all([listMonthlyPayouts(), listUsers()]);
  const customers = new Map<string, Customer>(users.map((u) => [u.id, { name: u.name, phone: u.phone }]));
  const customerOf = (id: string): Customer => customers.get(id) ?? { name: '', phone: '' };

  const due = rows.filter((r) => r.isDue);
  const upcoming = rows.filter((r) => !r.isDue);

  return (
    <div className="space-y-8">
      <PageHeader
        title="الدفعات الشهرية"
        description="اعتمد الربح الفعلي لكل شهر ليُصرف مع جزء رأس المال إلى محفظة المستثمر."
      />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="مستحقة الآن" value={due.length} tone="green" />
        <Stat label="قادمة" value={upcoming.length} tone="blue" />
      </div>

      <Section title="دفعات مستحقة" count={due.length}
        hint="أدخل الربح الفعلي للشهر (أو صفر) ثم اعتمد الصرف.">
        {due.length === 0
          ? <Card><EmptyState message="لا توجد دفعات مستحقة حالياً" /></Card>
          : <Grid>{due.map((row) => <PayoutCard key={`${row.id}-${row.month}`} row={row} customer={customerOf(row.userId)} userId={row.userId} />)}</Grid>}
      </Section>

      {upcoming.length > 0 && (
        <Section title="دفعات قادمة" count={upcoming.length} hint="تُفعّل عند حلول تاريخ الاستحقاق.">
          <Grid>{upcoming.map((row) => <PayoutCard key={`${row.id}-${row.month}`} row={row} customer={customerOf(row.userId)} userId={row.userId} />)}</Grid>
        </Section>
      )}

    </div>
  );
}

function PayoutCard({ row, customer, userId }: {
  row: Awaited<ReturnType<typeof listMonthlyPayouts>>[number]; customer: Customer; userId: string;
}) {
  return (
    <Card className={row.isDue ? 'border-green-200' : ''}>
      <CardHead customer={customer} userId={userId} category={row.title}
        badge={<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.isDue ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          الشهر {row.month} · {row.isDue ? 'مستحق' : fmtDate(row.dueAt)}
        </span>} />
      <Figures items={[['رأس مال معاد', row.principal], ['ربح متوقع', row.expectedProfit], ['المتبقي بعد الدفعة', row.remainingCapital]]} />
      {row.isDue
        ? <MonthlyPayoutForm id={row.id} month={row.month} isDue />
        : <p className="mt-4 text-xs text-gray-500">تاريخ الاستحقاق: {fmtDate(row.dueAt)}</p>}
    </Card>
  );
}

function CardHead({ customer, userId, category, badge }: {
  customer: Customer; userId: string; category: string; badge?: React.ReactNode;
}) {
  const name = customer.name || 'مستثمر بدون اسم';
  return (
    <div className="flex items-start gap-3">
      <NavAnchor href={`/users/${userId}`} className="shrink-0"><Avatar name={name} /></NavAnchor>
      <div className="min-w-0 flex-1">
        <NavAnchor href={`/users/${userId}`} className="block truncate font-semibold text-gray-900 hover:text-brand-blue">{name}</NavAnchor>
        {customer.phone && <p dir="ltr" className="text-right text-xs text-gray-500">{customer.phone}</p>}
        <p className="mt-1 truncate text-sm text-gray-500">{category}</p>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

function Figures({ items }: { items: [string, number][] }) {
  return (
    <dl className={`mt-4 grid gap-2 ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-gray-50 px-3 py-2">
          <dt className="truncate text-xs text-gray-500">{label}</dt>
          <dd className="mt-0.5 font-semibold text-gray-900">{fmt(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, count, hint, children }: { title: string; count: number; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          {title}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{count}</span>
        </h2>
        {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{children}</div>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'green' | 'blue' }) {
  const tones = { green: 'text-green-700', blue: 'text-brand-blue' };
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </Card>
  );
}
