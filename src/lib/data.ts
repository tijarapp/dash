import { adminDb } from './firebaseAdmin';
import { CATEGORY_DURATION_MONTHS } from './categoryProfit';
import {
  DEMO_MODE,
  demoAppSettings,
  demoCategories,
  demoDashboardData,
  demoOverviewStats,
  demoTransactions,
  demoUsers,
  demoWithdrawRequests,
} from './demo';

export interface AppSettings {
  appVersion: string;
  supportWhatsapp: string;
  supportTelegram: string;
  chargeRequestNumber: string;
  iosAppUrl: string;
  googlePlayAppUrl: string;
}

export interface CategoryRow {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  dailyProfitRate: number;
  minInvestment: number;
  durationMonths: number;
  isActive: boolean;
}

export interface UserRow {
  id: string;
  name: string;
  phone: string;
  goldBalance: number;
  dinarBalance: number;
  role: string;
  referralCode: string;
}

export interface TransactionRow {
  id: string;
  userId: string;
  type: string;
  goldAmount: number;
  dinarAmount: number;
  status: string;
  note: string | null;
  createdAt: string | null;
}

export interface WithdrawRow {
  id: string;
  userId: string;
  amount: number;
  cardHolder: string;
  cardNumber: string;
  swift: string;
  status: string;
  adminNote: string | null;
  createdAt: string | null;
}

export interface InvestmentRow {
  id: string;
  userId: string;
  categoryId: string;
  categoryTitle: string;
  amount: number;
  status: string;
  totalProfit: number;
  createdAt: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface InvestorSummary {
  id: string;
  name: string;
  phone: string;
  goldBalance: number;
  dinarBalance: number;
  referralCode: string;
  investmentCount: number;
  totalInvested: number;
  totalProfit: number;
}

export interface UserDetail {
  user: UserRow;
  isInvestor: boolean;
  investments: InvestmentRow[];
  transactions: TransactionRow[];
  withdrawRequests: WithdrawRow[];
  stats: {
    totalInvested: number;
    totalProfit: number;
    investmentCount: number;
    transactionCount: number;
  };
}

export interface DashboardData {
  stats: {
    usersCount: number;
    investorsCount: number;
    investmentsCount: number;
    totalInvested: number;
    pendingWithdrawals: number;
    totalGoldBalance: number;
    totalDinarBalance: number;
    activeCategories: number;
    totalCategories: number;
    totalProfitsDistributed: number;
    averageInvestment: number;
    pendingTransactions: number;
  };
  investors: InvestorSummary[];
  users: UserRow[];
  investments: InvestmentRow[];
  recentTransactions: TransactionRow[];
  pendingWithdrawals: WithdrawRow[];
  categories: CategoryRow[];
}

function isoFrom(value: FirebaseFirestore.Timestamp | undefined): string | null {
  return value ? value.toDate().toISOString() : null;
}

export async function getOverviewStats() {
  if (DEMO_MODE) return demoOverviewStats();

  const [usersSnap, investmentsSnap, withdrawsSnap] = await Promise.all([
    adminDb.collection('users').count().get(),
    adminDb.collection('investments').get(),
    adminDb.collection('withdrawRequests').where('status', '==', 'pending').count().get(),
  ]);

  const totalInvested = investmentsSnap.docs.reduce(
    (sum, doc) => sum + (Number(doc.data().amount) || 0),
    0,
  );

  return {
    usersCount: usersSnap.data().count,
    investmentsCount: investmentsSnap.size,
    totalInvested,
    pendingWithdrawals: withdrawsSnap.data().count,
  };
}

export async function listCategories(): Promise<CategoryRow[]> {
  if (DEMO_MODE) return demoCategories;

  const snap = await adminDb.collection('investmentCategories').get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title ?? '',
      description: d.description ?? '',
      imageUrl: d.imageUrl ?? '',
      dailyProfitRate: Number(d.dailyProfitRate) || 0,
      minInvestment: Number(d.minInvestment) || 0,
      durationMonths: Number(d.durationMonths) || CATEGORY_DURATION_MONTHS,
      isActive: Boolean(d.isActive),
    };
  });
}

export async function getCategoryById(id: string): Promise<CategoryRow | null> {
  if (DEMO_MODE) return demoCategories.find((c) => c.id === id) ?? null;

  const snap = await adminDb.collection('investmentCategories').doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    title: d.title ?? '',
    description: d.description ?? '',
    imageUrl: d.imageUrl ?? '',
    dailyProfitRate: Number(d.dailyProfitRate) || 0,
    minInvestment: Number(d.minInvestment) || 0,
    durationMonths: Number(d.durationMonths) || CATEGORY_DURATION_MONTHS,
    isActive: Boolean(d.isActive),
  };
}

export async function listUsers(): Promise<UserRow[]> {
  if (DEMO_MODE) return demoUsers;

  const snap = await adminDb.collection('users').limit(200).get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? '',
      phone: d.phone ?? '',
      goldBalance: Number(d.goldBalance) || 0,
      dinarBalance: Number(d.dinarBalance) || 0,
      role: d.role ?? 'user',
      referralCode: d.referralCode ?? '',
    };
  });
}

export async function listTransactions(): Promise<TransactionRow[]> {
  if (DEMO_MODE) return demoTransactions;

  const snap = await adminDb
    .collection('transactions')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      userId: d.userId ?? '',
      type: d.type ?? 'unknown',
      goldAmount: Number(d.goldAmount) || 0,
      dinarAmount: Number(d.dinarAmount) || 0,
      status: d.status ?? 'completed',
      note: d.note ?? null,
      createdAt: isoFrom(d.createdAt),
    };
  });
}

export async function listWithdrawRequests(): Promise<WithdrawRow[]> {
  if (DEMO_MODE) return demoWithdrawRequests;

  const snap = await adminDb
    .collection('withdrawRequests')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      userId: d.userId ?? '',
      amount: Number(d.amount) || 0,
      cardHolder: d.cardHolder ?? '',
      cardNumber: d.cardNumber ?? '',
      swift: d.swift ?? '',
      status: d.status ?? 'pending',
      adminNote: d.adminNote ?? null,
      createdAt: isoFrom(d.createdAt),
    };
  });
}

export async function getWithdrawRequestById(id: string): Promise<WithdrawRow | null> {
  if (DEMO_MODE) return demoWithdrawRequests.find((r) => r.id === id) ?? null;

  const snap = await adminDb.collection('withdrawRequests').doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    userId: d.userId ?? '',
    amount: Number(d.amount) || 0,
    cardHolder: d.cardHolder ?? '',
    cardNumber: d.cardNumber ?? '',
    swift: d.swift ?? '',
    status: d.status ?? 'pending',
    adminNote: d.adminNote ?? null,
    createdAt: isoFrom(d.createdAt),
  };
}

const APP_SETTINGS_DOC = 'settings/app';

export async function getAppSettings(): Promise<AppSettings> {
  if (DEMO_MODE) return { ...demoAppSettings };

  const snap = await adminDb.doc(APP_SETTINGS_DOC).get();
  if (!snap.exists) {
    return {
      appVersion: '',
      supportWhatsapp: '',
      supportTelegram: '',
      chargeRequestNumber: '',
      iosAppUrl: '',
      googlePlayAppUrl: '',
    };
  }

  const d = snap.data()!;
  return {
    appVersion: String(d.appVersion ?? ''),
    supportWhatsapp: String(d.supportWhatsapp ?? ''),
    supportTelegram: String(d.supportTelegram ?? ''),
    chargeRequestNumber: String(d.chargeRequestNumber ?? ''),
    iosAppUrl: String(d.iosAppUrl ?? ''),
    googlePlayAppUrl: String(d.googlePlayAppUrl ?? ''),
  };
}

export async function listInvestments(): Promise<InvestmentRow[]> {
  if (DEMO_MODE) return demoDashboardData().investments;

  const [investmentsSnap, categories] = await Promise.all([
    adminDb.collection('investments').limit(200).get(),
    listCategories(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.title]));

  const rows = investmentsSnap.docs.map((doc) => {
    const d = doc.data();
    const categoryId = d.categoryId ?? '';
    return {
      id: doc.id,
      userId: d.userId ?? '',
      categoryId,
      categoryTitle: categoryMap.get(categoryId) ?? d.categoryTitle ?? '—',
      amount: Number(d.amount) || 0,
      status: d.status ?? 'active',
      totalProfit: Number(d.totalProfit ?? d.profit) || 0,
      createdAt: isoFrom(d.createdAt),
      startDate: isoFrom(d.startDate),
      endDate: isoFrom(d.endDate),
    };
  });

  return rows.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function buildInvestorSummaries(
  users: UserRow[],
  investments: InvestmentRow[],
): InvestorSummary[] {
  const byUser = new Map<string, { count: number; invested: number; profit: number }>();

  for (const inv of investments) {
    const current = byUser.get(inv.userId) ?? { count: 0, invested: 0, profit: 0 };
    current.count += 1;
    current.invested += inv.amount;
    current.profit += inv.totalProfit;
    byUser.set(inv.userId, current);
  }

  return users
    .filter((u) => u.role !== 'admin')
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
}

function buildRegularUsers(
  users: UserRow[],
  investments: InvestmentRow[],
): UserRow[] {
  const investorIds = new Set(investments.map((inv) => inv.userId));
  return users
    .filter((u) => u.role !== 'admin' && !investorIds.has(u.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

export async function listInvestors(): Promise<InvestorSummary[]> {
  const [users, investments] = await Promise.all([listUsers(), listInvestments()]);
  return buildInvestorSummaries(users, investments);
}

export async function listRegularUsers(): Promise<UserRow[]> {
  const [users, investments] = await Promise.all([listUsers(), listInvestments()]);
  return buildRegularUsers(users, investments);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  if (DEMO_MODE) return demoUsers.find((u) => u.id === id) ?? null;

  const snap = await adminDb.collection('users').doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    name: d.name ?? '',
    phone: d.phone ?? '',
    goldBalance: Number(d.goldBalance) || 0,
    dinarBalance: Number(d.dinarBalance) || 0,
    role: d.role ?? 'user',
    referralCode: d.referralCode ?? '',
  };
}

export async function getUserNameMap(): Promise<Record<string, string>> {
  const users = await listUsers();
  return Object.fromEntries(
    users.map((u) => [u.id, u.name || u.phone || u.id.slice(0, 8)]),
  );
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const [user, investments, transactions, withdrawRequests] = await Promise.all([
    getUserById(id),
    listInvestments(),
    listTransactions(),
    listWithdrawRequests(),
  ]);

  if (!user) return null;

  const userInvestments = investments.filter((i) => i.userId === id);
  const userTransactions = transactions.filter((t) => t.userId === id);
  const userWithdrawals = withdrawRequests.filter((w) => w.userId === id);

  return {
    user,
    isInvestor: userInvestments.length > 0,
    investments: userInvestments,
    transactions: userTransactions,
    withdrawRequests: userWithdrawals,
    stats: {
      totalInvested: userInvestments.reduce((sum, i) => sum + i.amount, 0),
      totalProfit: userInvestments.reduce((sum, i) => sum + i.totalProfit, 0),
      investmentCount: userInvestments.length,
      transactionCount: userTransactions.length,
    },
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (DEMO_MODE) return demoDashboardData();

  const [users, investments, transactions, withdrawRequests, categories] = await Promise.all([
    listUsers(),
    listInvestments(),
    listTransactions(),
    listWithdrawRequests(),
    listCategories(),
  ]);

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalGoldBalance = users.reduce((sum, u) => sum + u.goldBalance, 0);
  const totalDinarBalance = users.reduce((sum, u) => sum + u.dinarBalance, 0);
  const totalProfitsDistributed = transactions
    .filter((t) => t.type === 'profit' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.max(t.goldAmount, 0), 0);
  const pendingWithdrawals = withdrawRequests.filter((w) => w.status === 'pending');
  const pendingTransactions = transactions.filter((t) => t.status === 'pending').length;
  const investors = buildInvestorSummaries(users, investments);
  const regularUsers = buildRegularUsers(users, investments);

  return {
    stats: {
      usersCount: regularUsers.length,
      investorsCount: investors.length,
      investmentsCount: investments.length,
      totalInvested,
      pendingWithdrawals: pendingWithdrawals.length,
      totalGoldBalance,
      totalDinarBalance,
      activeCategories: categories.filter((c) => c.isActive).length,
      totalCategories: categories.length,
      totalProfitsDistributed,
      averageInvestment: investments.length > 0 ? totalInvested / investments.length : 0,
      pendingTransactions,
    },
    investors,
    users: regularUsers,
    investments,
    recentTransactions: transactions.slice(0, 10),
    pendingWithdrawals: pendingWithdrawals.slice(0, 5),
    categories,
  };
}
