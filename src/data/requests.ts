import type { ReportRequest } from './types'

export const INITIAL_REQUESTS: ReportRequest[] = [
  {
    id: 'req-1001',
    modelId: 'mdl-behsaz-rb',
    question: 'فروش سه ماه اخیر به تفکیک مشتری با مبلغ کل سفارش',
    status: 'delivered',
    createdAt: '1404/12/18 — ۱۴:۲۰',
    updatedAt: '1404/12/18 — ۱۴:۲۲',
    docVersionId: 'ver-behsaz-3.2',
    returnedQuery: `SELECT TOP 100
  o.OrderId,
  o.OrderDate,
  c.CustomerName,
  SUM(oi.Quantity * oi.UnitPrice) AS TotalAmount
FROM dbo.Orders o
INNER JOIN dbo.Customers c ON c.CustomerId = o.CustomerId
INNER JOIN dbo.OrderItems oi ON oi.OrderId = o.OrderId
WHERE o.OrderDate >= DATEADD(MONTH, -3, GETDATE())
GROUP BY o.OrderId, o.OrderDate, c.CustomerName
ORDER BY TotalAmount DESC;`,
    deliveryNote:
      'کوئری به نرم‌افزار محلی سازنده تحویل شد؛ اجرا و خروجی گزارش در سمت نرم‌افزار مقصد انجام شده است. (دمو)',
    baseIrr: 8500,
    markupIrr: 2500,
  },
  {
    id: 'req-1002',
    modelId: 'mdl-behsaz-rb',
    question: 'موجودی کالاهای فعال به تفکیک انبار',
    status: 'query-ready',
    createdAt: '1404/12/20 — ۰۹:۱۰',
    updatedAt: '1404/12/20 — ۰۹:۱۱',
    docVersionId: 'ver-behsaz-3.2',
    returnedQuery: `SELECT
  w.WarehouseCode,
  i.ItemCode,
  i.ItemName,
  SUM(st.OnHandQty) AS OnHand,
  SUM(st.ReservedQty) AS Reserved
FROM dbo.Stock st
INNER JOIN dbo.Warehouses w ON w.WarehouseId = st.WarehouseId
INNER JOIN dbo.Items i ON i.ItemId = st.ItemId
WHERE st.OnHandQty > 0
GROUP BY w.WarehouseCode, i.ItemCode, i.ItemName
ORDER BY OnHand DESC;`,
    deliveryNote: 'کوئری آماده است؛ منتظر تحویل/اجرا در نرم‌افزار مقصد. (mock)',
    baseIrr: 8500,
    markupIrr: 2500,
  },
  {
    id: 'req-1003',
    modelId: 'mdl-hesab-rb',
    question: 'گردش ماهانه دفترکل بدون اسناد ابطال‌شده',
    status: 'failed',
    createdAt: '1404/11/05 — ۱۶:۴۰',
    updatedAt: '1404/11/05 — ۱۶:۴۱',
    docVersionId: 'ver-hesab-2.0',
    errorMessage: 'پلن پشتیبانی منقضی است — درخواست جدید مسدود. (mock)',
    baseIrr: 0,
    markupIrr: 0,
  },
  {
    id: 'req-1004',
    modelId: 'mdl-own-demo',
    question: 'نمونه گزارش داخلی روی مدل خودم',
    status: 'delivered',
    createdAt: '1404/12/22 — ۱۱:۰۰',
    updatedAt: '1404/12/22 — ۱۱:۰۱',
    docVersionId: 'ver-own-1.0',
    returnedQuery: `SELECT 1 AS DemoSelfUse;`,
    deliveryNote:
      'مصرف مدل خود — فقط Base به پلتفرم؛ Markup اعمال نشد. (mock)',
    baseIrr: 8500,
    markupIrr: 0,
  },
]

let requestSeq = 1100

export function nextRequestId(): string {
  requestSeq += 1
  return `req-${requestSeq}`
}

export function buildMockQuery(question: string): string {
  const safe = question.replace(/\n/g, ' ').slice(0, 120)
  return `SELECT
  p.ProductCode,
  p.ProductName,
  SUM(s.Quantity) AS QtySold,
  SUM(s.Quantity * s.UnitPrice) AS Revenue
FROM dbo.Sales s
INNER JOIN dbo.Products p ON p.ProductId = s.ProductId
WHERE s.SaleDate BETWEEN @FromDate AND @ToDate
  /* درخواست: ${safe} */
GROUP BY p.ProductCode, p.ProductName
ORDER BY Revenue DESC;`
}
