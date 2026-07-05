import type {
  AppSettings,
  CategoryRow,
  DashboardData,
  InvestmentRow,
  TransactionRow,
  UserRow,
  WithdrawRow,
} from './data';

/// When true, the whole app runs without Firebase using the in-memory data
/// below. Toggle via NEXT_PUBLIC_DEMO_MODE in .env.local.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_SESSION_VALUE = 'demo-session';

export const DEMO_USER = {
  uid: 'demo-admin',
  email: 'admin@tjaraa.demo',
  role: 'admin',
};

export const demoAppSettings: AppSettings = {
  appVersion: '1.0.0',
  supportWhatsapp: '962791234567',
  chargeRequestNumber: '962791234567',
};

export const demoCategories: CategoryRow[] = [
  {
    id: 'cat-gold',
    title: 'سبائك الذهب',
    description: 'استثمار في سبائك الذهب عيار 24 بعوائد يومية ثابتة.',
    imageUrl: '',
    dailyProfitRate: 0.45,
    minInvestment: 500,
    durationMonths: 12,
    isActive: true,
  },
  {
    id: 'cat-silver',
    title: 'الفضة',
    description: 'محفظة فضة متوسطة المخاطر بعائد شهري.',
    imageUrl: '',
    dailyProfitRate: 0.33,
    minInvestment: 250,
    durationMonths: 12,
    isActive: true,
  },
  {
    id: 'cat-realestate',
    title: 'العقارات',
    description: 'صندوق عقاري طويل الأجل بعائد يومي ثابت.',
    imageUrl: '',
    dailyProfitRate: 0.5,
    minInvestment: 2000,
    durationMonths: 12,
    isActive: true,
  },
  {
    id: 'cat-startup',
    title: 'الشركات الناشئة',
    description: 'فرص في شركات ناشئة مختارة.',
    imageUrl: '',
    dailyProfitRate: 0.55,
    minInvestment: 5000,
    durationMonths: 12,
    isActive: false,
  },
];

export const demoUsers: UserRow[] = [
  { id: 'u-1001', name: 'أحمد الهاشمي', phone: '0791234567', goldBalance: 12500, dinarBalance: 8200, role: 'user', referralCode: 'AH1001' },
  { id: 'u-1002', name: 'سارة العلي', phone: '0789876543', goldBalance: 4300, dinarBalance: 15600, role: 'user', referralCode: 'SA1002' },
  { id: 'u-1003', name: 'محمد قاسم', phone: '0771122334', goldBalance: 0, dinarBalance: 320, role: 'user', referralCode: 'MQ1003' },
  { id: 'u-1004', name: 'لينا خالد', phone: '0795544332', goldBalance: 78000, dinarBalance: 41200, role: 'user', referralCode: 'LK1004' },
  { id: 'u-1005', name: 'يوسف الناصر', phone: '0788001122', goldBalance: 2100, dinarBalance: 900, role: 'user', referralCode: 'YN1005' },
  { id: 'u-1006', name: 'دانة سمير', phone: '0790099887', goldBalance: 33500, dinarBalance: 12750, role: 'user', referralCode: 'DS1006' },
  { id: 'u-1007', name: 'عمر فؤاد', phone: '0775566778', goldBalance: 640, dinarBalance: 0, role: 'user', referralCode: 'OF1007' },
  { id: 'u-1008', name: 'هبة الزعبي', phone: '0782233445', goldBalance: 19800, dinarBalance: 26400, role: 'user', referralCode: 'HZ1008' },
];

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const demoTransactions: TransactionRow[] = [
  { id: 't-9001', userId: 'u-1001', type: 'charge', goldAmount: 5000, dinarAmount: 5000, status: 'completed', note: 'شحن أولي', createdAt: daysAgo(0) },
  { id: 't-9002', userId: 'u-1004', type: 'invest', goldAmount: 20000, dinarAmount: 20000, status: 'completed', note: 'استثمار عقاري', createdAt: daysAgo(1) },
  { id: 't-9003', userId: 'u-1002', type: 'profit', goldAmount: 320, dinarAmount: 320, status: 'completed', note: 'ربح يومي', createdAt: daysAgo(1) },
  { id: 't-9004', userId: 'u-1006', type: 'withdraw', goldAmount: -1500, dinarAmount: -1500, status: 'completed', note: 'سحب معتمد', createdAt: daysAgo(2) },
  { id: 't-9005', userId: 'u-1008', type: 'charge', goldAmount: 10000, dinarAmount: 10000, status: 'completed', note: null, createdAt: daysAgo(3) },
  { id: 't-9006', userId: 'u-1005', type: 'profit', goldAmount: 45, dinarAmount: 45, status: 'completed', note: 'ربح يومي', createdAt: daysAgo(3) },
  { id: 't-9007', userId: 'u-1003', type: 'charge', goldAmount: 300, dinarAmount: 300, status: 'pending', note: 'بانتظار التأكيد', createdAt: daysAgo(4) },
  { id: 't-9008', userId: 'u-1001', type: 'invest', goldAmount: 8000, dinarAmount: 8000, status: 'completed', note: 'استثمار ذهب', createdAt: daysAgo(5) },
  { id: 't-9009', userId: 'u-1007', type: 'withdraw', goldAmount: -200, dinarAmount: -200, status: 'completed', note: 'سحب معتمد', createdAt: daysAgo(6) },
  { id: 't-9010', userId: 'u-1004', type: 'profit', goldAmount: 1200, dinarAmount: 1200, status: 'completed', note: 'ربح أسبوعي', createdAt: daysAgo(7) },
];

export const demoWithdrawRequests: WithdrawRow[] = [
  { id: 'w-5001', userId: 'u-1004', amount: 5000, cardHolder: 'Lina Khaled', cardNumber: '4111 1111 1111 1234', swift: 'ARABJOAX', status: 'pending', adminNote: null, createdAt: daysAgo(0) },
  { id: 'w-5002', userId: 'u-1008', amount: 2200, cardHolder: 'Heba Alzoubi', cardNumber: '5500 0000 0000 4321', swift: 'JKBAJOAM', status: 'pending', adminNote: null, createdAt: daysAgo(1) },
  { id: 'w-5003', userId: 'u-1001', amount: 800, cardHolder: 'Ahmad Hashemi', cardNumber: '4012 8888 8888 1881', swift: 'CBJOJOAX', status: 'approved', adminNote: null, createdAt: daysAgo(2) },
  { id: 'w-5004', userId: 'u-1006', amount: 1500, cardHolder: 'Dana Samir', cardNumber: '6011 0009 9013 9424', swift: 'BBOSJOAM', status: 'pending', adminNote: null, createdAt: daysAgo(3) },
  { id: 'w-5005', userId: 'u-1007', amount: 200, cardHolder: 'Omar Fouad', cardNumber: '3530 1113 3330 0000', swift: 'AHLIJOAM', status: 'rejected', adminNote: 'بيانات البطاقة غير صحيحة', createdAt: daysAgo(5) },
];

export const demoInvestments: InvestmentRow[] = [
  { id: 'inv-1', userId: 'u-1004', categoryId: 'cat-realestate', categoryTitle: 'العقارات', amount: 20000, status: 'active', totalProfit: 3200, createdAt: daysAgo(1), startDate: daysAgo(1), endDate: daysAgo(-700) },
  { id: 'inv-2', userId: 'u-1001', categoryId: 'cat-gold', categoryTitle: 'سبائك الذهب', amount: 8000, status: 'active', totalProfit: 540, createdAt: daysAgo(5), startDate: daysAgo(5), endDate: daysAgo(-360) },
  { id: 'inv-3', userId: 'u-1006', categoryId: 'cat-gold', categoryTitle: 'سبائك الذهب', amount: 15000, status: 'active', totalProfit: 980, createdAt: daysAgo(10), startDate: daysAgo(10), endDate: daysAgo(-355) },
  { id: 'inv-4', userId: 'u-1008', categoryId: 'cat-silver', categoryTitle: 'الفضة', amount: 10000, status: 'active', totalProfit: 420, createdAt: daysAgo(3), startDate: daysAgo(3), endDate: daysAgo(-177) },
  { id: 'inv-5', userId: 'u-1002', categoryId: 'cat-silver', categoryTitle: 'الفضة', amount: 3000, status: 'active', totalProfit: 95, createdAt: daysAgo(14), startDate: daysAgo(14), endDate: daysAgo(-166) },
  { id: 'inv-6', userId: 'u-1004', categoryId: 'cat-gold', categoryTitle: 'سبائك الذهب', amount: 35000, status: 'active', totalProfit: 2100, createdAt: daysAgo(20), startDate: daysAgo(20), endDate: daysAgo(-345) },
  { id: 'inv-7', userId: 'u-1001', categoryId: 'cat-realestate', categoryTitle: 'العقارات', amount: 5000, status: 'completed', totalProfit: 1100, createdAt: daysAgo(90), startDate: daysAgo(90), endDate: daysAgo(0) },
  { id: 'inv-8', userId: 'u-1008', categoryId: 'cat-gold', categoryTitle: 'سبائك الذهب', amount: 7500, status: 'active', totalProfit: 310, createdAt: daysAgo(7), startDate: daysAgo(7), endDate: daysAgo(-358) },
];

export function demoDashboardData(): DashboardData {
  const totalInvested = demoInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalGoldBalance = demoUsers.reduce((sum, u) => sum + u.goldBalance, 0);
  const totalDinarBalance = demoUsers.reduce((sum, u) => sum + u.dinarBalance, 0);
  const totalProfitsDistributed = demoTransactions
    .filter((t) => t.type === 'profit' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.max(t.goldAmount, 0), 0);
  const pendingWithdrawals = demoWithdrawRequests.filter((w) => w.status === 'pending');

  const byUser = new Map<string, { count: number; invested: number; profit: number }>();
  for (const inv of demoInvestments) {
    const current = byUser.get(inv.userId) ?? { count: 0, invested: 0, profit: 0 };
    current.count += 1;
    current.invested += inv.amount;
    current.profit += inv.totalProfit;
    byUser.set(inv.userId, current);
  }

  const investors = demoUsers
    .map((u) => {
      const summary = byUser.get(u.id) ?? { count: 0, invested: 0, profit: 0 };
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        goldBalance: u.goldBalance,
        dinarBalance: u.dinarBalance,
        referralCode: u.referralCode,
        investmentCount: summary.count,
        totalInvested: summary.invested,
        totalProfit: summary.profit,
      };
    })
    .filter((u) => u.investmentCount > 0)
    .sort((a, b) => b.totalInvested - a.totalInvested);

  const investorIds = new Set(investors.map((i) => i.id));
  const regularUsers = demoUsers.filter((u) => !investorIds.has(u.id));

  return {
    stats: {
      usersCount: regularUsers.length,
      investorsCount: investors.length,
      investmentsCount: demoInvestments.length,
      totalInvested,
      pendingWithdrawals: pendingWithdrawals.length,
      totalGoldBalance,
      totalDinarBalance,
      activeCategories: demoCategories.filter((c) => c.isActive).length,
      totalCategories: demoCategories.length,
      totalProfitsDistributed,
      averageInvestment: demoInvestments.length > 0 ? totalInvested / demoInvestments.length : 0,
      pendingTransactions: demoTransactions.filter((t) => t.status === 'pending').length,
    },
    investors,
    users: regularUsers,
    investments: demoInvestments,
    recentTransactions: demoTransactions.slice(0, 10),
    pendingWithdrawals: pendingWithdrawals.slice(0, 5),
    categories: demoCategories,
  };
}

export function demoOverviewStats() {
  const data = demoDashboardData();
  return {
    usersCount: data.stats.usersCount,
    investmentsCount: data.stats.investmentsCount,
    totalInvested: data.stats.totalInvested,
    pendingWithdrawals: data.stats.pendingWithdrawals,
  };
}
