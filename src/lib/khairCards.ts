// Default card types, overridden by the saved catalog. Purchases keep their original snapshots.
export const KHAIR_CARDS = [
  { id: 'baraka', name: 'بطاقة أثر بركة', cost: 1000, chances: 1, color: '#168B69' },
  { id: 'rahma', name: 'بطاقة أثر رحمة', cost: 3000, chances: 3, color: '#1E5AA8' },
  { id: 'ataa', name: 'بطاقة أثر عطاء', cost: 5000, chances: 7, color: '#A76C19' },
].map((card, order) => ({ ...card, order, description: '', imageUrl: '', isActive: true }));
