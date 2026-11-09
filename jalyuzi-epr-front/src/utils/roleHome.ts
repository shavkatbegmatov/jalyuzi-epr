/**
 * Rolga qarab mobil panel yo'li: o'rnatuvchi → /installer/, menejer → /manager/.
 * Boshqa rollar uchun null (asosiy ERP).
 */
export function getRolePanelPath(roles?: Iterable<string> | null): string | null {
  const list = roles ? Array.from(roles) : [];
  if (list.includes('INSTALLER')) return '/installer/';
  if (list.includes('MANAGER')) return '/manager/';
  return null;
}
