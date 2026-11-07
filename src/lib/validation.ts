export function fieldError(field: HTMLInputElement | HTMLSelectElement): string | null {
  const label =
    Array.from(field.labels?.[0]?.childNodes || [])
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join('')
      .trim() ||
    field.getAttribute('aria-label') ||
    'ข้อมูล';
  const value = field.value.trim();
  if (field.validity.badInput) return `กรุณากรอก${label}ให้ถูกต้อง`;
  if (field.required && !value) return `กรุณากรอก${label}`;
  if (!value) return null;
  if (field instanceof HTMLInputElement && field.type === 'number') {
    if (!Number.isFinite(Number(value))) return `กรุณากรอก${label}เป็นตัวเลข`;
    if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
      return `กรุณากรอก${label}ระหว่าง ${field.min}–${field.max}`;
    }
    if (field.validity.stepMismatch) {
      return field.step === '1'
        ? `กรุณากรอก${label}เป็นจำนวนเต็ม`
        : `กรุณากรอก${label}ไม่เกิน 2 ตำแหน่งทศนิยม`;
    }
  }
  if (!field.validity.valid) return `กรุณากรอก${label}ให้ถูกต้อง`;
  return null;
}
