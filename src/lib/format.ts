const faDigits = '۰۱۲۳۴۵۶۷۸۹'

export function toFaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => faDigits[Number(d)] ?? d)
}

export function formatIrr(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('en-US')
  return `${toFaDigits(formatted)} ریال`
}

export function supportLabel(
  status: 'active' | 'expired' | 'none' | 'not-required',
): string {
  switch (status) {
    case 'active':
      return 'پشتیبانی فعال'
    case 'expired':
      return 'پشتیبانی منقضی'
    case 'none':
      return 'بدون پلن'
    case 'not-required':
      return 'بدون پیش‌نیاز پشتیبانی'
  }
}

export function requestStatusLabel(
  status: 'submitted' | 'processing' | 'query-ready' | 'delivered' | 'failed',
): string {
  switch (status) {
    case 'submitted':
      return 'ثبت‌شده'
    case 'processing':
      return 'در حال پردازش'
    case 'query-ready':
      return 'کوئری آماده'
    case 'delivered':
      return 'تحویل‌شده'
    case 'failed':
      return 'ناموفق'
  }
}
