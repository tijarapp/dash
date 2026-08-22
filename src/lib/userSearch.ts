export interface SearchablePerson {
  name: string;
  phone: string;
  referralCode: string;
}

export function matchesPersonQuery(person: SearchablePerson, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    person.name.toLowerCase().includes(q) ||
    person.phone.toLowerCase().includes(q) ||
    person.referralCode.toLowerCase().includes(q)
  );
}
