import { Link } from 'react-router-dom'
import { PageHeader, StatusBanner } from '../components/ui/Primitives'

export function HowItWorksPage() {
  return (
    <div>
      <PageHeader
        title="کلید دسترسی چطور استفاده می‌شود؟"
        description="سطح مصرف کوئری‌ساز: فقط‌کلید — توضیح آموزشی برای مصرف‌کننده"
      />

      <StatusBanner tone="info">
        الگوی سرویس کوئری‌ساز: <strong>فقط‌کلید</strong>. خریدار مدل نهایی منوی تست در رابط
        ندارد. پلتفرم کوئری را برمی‌گرداند؛ اجرا در نرم‌افزار محلی سازنده است.
      </StatusBanner>

      <section className="panel">
        <h2 className="panel-title">نقش‌ها در یک نگاه</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">۱</div>
            <div>
              <strong>مدل‌ساز</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                مستندات دیتابیس را در نسخه‌های دانش پیاده‌سازی/منتشر می‌کند و نرم‌افزار محلی
                مقصد را می‌سازد. انتشار مدل نیاز به تأیید پلتفرم نمونه ندارد.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">۲</div>
            <div>
              <strong>مصرف‌کننده</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                از پلتفرم نمونه کلید دسترسی می‌گیرد و آن را داخل نرم‌افزار سازنده قرار می‌دهد. کیف پول را
                با ریال شارژ می‌کند (نه توکن جداگانه).
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">۳</div>
            <div>
              <strong>رزرو، کوئری، اجرا</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                درخواست با کلید می‌آید → سرویس تخمین می‌زند → پلتفرم رزرو می‌کند → کوئری
                برمی‌گردد → اجرا و خروجی در سمت نرم‌افزار سازنده.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: '0.9rem' }}>
        <h2 className="panel-title">در این دمو چه می‌بینید؟</h2>
        <ul style={{ marginTop: 0 }}>
          <li>
            <Link to="/consumer/discover">کشف مدل‌ها</Link> با قیمت پایه + حاشیه، امتیاز/نظر، و وضعیت
            پشتیبانی
          </li>
          <li>
            فرم «ثبت درخواست» به‌عنوان شبیه‌سازی فراخوانی با کلید (با مسدودسازی بدهی / پشتیبانی
            منقضی / موجودی ناکافی)
          </li>
          <li>صفحه وضعیت با کوئری بازگشتی و شبیه‌سازی تحویل محلی</li>
          <li>
            <Link to="/consumer/wallet">کیف پول ریالی</Link> با سناریوی بدهی و هشدار موجودی کم
          </li>
          <li>
            خرید پلن پشتیبانی با صورت‌حساب — بدون استرداد در نسخه اول؛ سهم پلتفرم نمونه از پشتیبانی صفر
          </li>
        </ul>
        <p className="meta" style={{ marginBottom: 0 }}>
          محیط آزمایشی رایگان نداریم. برجسته‌سازی در کشف فعلاً نیست.
        </p>
      </section>
    </div>
  )
}
