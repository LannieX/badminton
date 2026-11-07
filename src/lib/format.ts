export const formatMoney = (baht: number) =>
  baht.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatSatang = (cents: number) => formatMoney(cents / 100);

export const formatSessionDate = (date: string) => date.split('-').reverse().join('/');
