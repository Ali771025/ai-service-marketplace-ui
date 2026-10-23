import { useState } from 'react'

import { Link } from 'react-router-dom'

import { useMockStore } from '../data/MockStore'

import {

  PageHeader,

  StatusBanner,

} from '../components/ui/Primitives'

import { formatIrr } from '../lib/format'

import type { DemoWalletScenario } from '../data/types'

import { walletBudgetAlert } from '../data/wallet'



const SCENARIOS: { id: DemoWalletScenario; label: string }[] = [

  { id: 'healthy', label: 'سالم' },

  { id: 'low', label: 'موجودی کم' },

  { id: 'debt', label: 'بدهی (منفی)' },

]



export function WalletPage() {

  const {

    wallet,

    availableIrr,

    mockTopUp,

    walletScenario,

    setWalletScenario,

    updateWalletSettings,

  } = useMockStore()

  const [amount, setAmount] = useState('500000')

  const [confirmOpen, setConfirmOpen] = useState(false)

  const [threshold, setThreshold] = useState(String(wallet.lowBalanceThresholdIrr))

  const [cap, setCap] = useState(

    wallet.monthlyBudgetCapIrr != null ? String(wallet.monthlyBudgetCapIrr) : '',

  )

  const [warnSoft, setWarnSoft] = useState(String(wallet.budgetWarnPctSoft))

  const [warnElevated, setWarnElevated] = useState(String(wallet.budgetWarnPctElevated))



  const low = availableIrr >= 0 && availableIrr < wallet.lowBalanceThresholdIrr

  const budgetAlert = walletBudgetAlert(wallet)



  return (

    <div>

      <PageHeader

        title="کیف پول"

        description="موجودی پولی به ریال (IRR) — نه Token. قابل‌استفاده ≈ Posted − Reserved"

      />



      <section className="panel" style={{ marginBottom: '0.9rem' }}>

        <h2 className="panel-title">سناریوی دمو (RFP)</h2>

        <p className="meta" style={{ marginTop: 0 }}>

          برای نمایش هشدار موجودی کم، بدهی یک‌باره، و مسدود شدن مصرف جدید.

        </p>

        <div className="scenario-bar">

          {SCENARIOS.map((s) => (

            <button

              key={s.id}

              type="button"

              className={`btn btn-secondary btn-sm${walletScenario === s.id ? ' active' : ''}`}

              onClick={() => setWalletScenario(s.id)}

            >

              {s.label}

            </button>

          ))}

        </div>

      </section>



      {availableIrr < 0 ? (

        <StatusBanner tone="danger">

          بدهی {formatIrr(Math.abs(availableIrr))} — مصرف جدید تا تسویه مسدود است.

          بدهی فقط از لبه «تخمین کمتر از مبلغ قطعی» در همان یک درخواست در حال اجرا پیش می‌آید

          (نه نسیه).

        </StatusBanner>

      ) : null}

      {low ? (

        <StatusBanner tone="warn">

          هشدار موجودی کم: زیر آستانه {formatIrr(wallet.lowBalanceThresholdIrr)}.

        </StatusBanner>

      ) : null}

      {budgetAlert.level === 'capped' ? (

        <StatusBanner tone="danger">

          سقف بودجه ماهانه پر شده — مصرف جدید مسدود است تا تغییر سقف یا ماه بعد.

        </StatusBanner>

      ) : budgetAlert.level === 'elevated' ? (

        <StatusBanner tone="warn">

          هشدار بودجه ماهانه ({wallet.budgetWarnPctElevated}٪+): حدود {budgetAlert.pct}٪ سقف مصرف

          شده ({formatIrr(wallet.monthlySpentIrr)} از {formatIrr(wallet.monthlyBudgetCapIrr!)}). هنوز

          قابل‌استفاده است.

        </StatusBanner>

      ) : budgetAlert.level === 'soft' ? (

        <StatusBanner tone="info">

          هشدار بودجه ماهانه ({wallet.budgetWarnPctSoft}٪+): حدود {budgetAlert.pct}٪ سقف مصرف شده (

          {formatIrr(wallet.monthlySpentIrr)} از {formatIrr(wallet.monthlyBudgetCapIrr!)}). هنوز

          قابل‌استفاده است.

        </StatusBanner>

      ) : null}



      <section className="panel">

        <p className="meta" style={{ margin: 0 }}>

          موجودی قابل‌استفاده

        </p>

        <p className="hero-balance">{formatIrr(availableIrr)}</p>

        <p className="meta">

          Posted: {formatIrr(wallet.postedIrr)} · رزرو:{' '}

          {formatIrr(wallet.reservedIrr)}

        </p>

        <p className="meta" style={{ marginBottom: 0 }}>

          قبل از هر مصرف، مبلغ تخمینی سرویس رزرو می‌شود؛ پس از Settlement، قطعی کم و باقیمانده

          آزاد می‌شود.

        </p>

      </section>



      <div className="detail-grid two" style={{ marginTop: '0.9rem' }}>

        <section className="panel stack">

          <h2 className="panel-title">شارژ (دمو)</h2>

          <div className="field">

            <label htmlFor="amt">مبلغ شارژ</label>

            <input

              id="amt"

              type="number"

              min={1000}

              step={1000}

              value={amount}

              onChange={(e) => setAmount(e.target.value)}

            />

          </div>

          <p className="meta">روش: درگاه (mock)</p>

          <button

            type="button"

            className="btn btn-primary"

            onClick={() => setConfirmOpen(true)}

          >

            شارژ کیف پول

          </button>

          {confirmOpen ? (

            <div className="banner banner-info">

              تأیید شارژ {formatIrr(Number(amount) || 0)}؟

              <div className="btn-row">

                <button

                  type="button"

                  className="btn btn-primary"

                  onClick={() => {

                    mockTopUp(Number(amount) || 0)

                    setConfirmOpen(false)

                  }}

                >

                  تأیید

                </button>

                <button

                  type="button"

                  className="btn btn-secondary"

                  onClick={() => setConfirmOpen(false)}

                >

                  انصراف

                </button>

              </div>

            </div>

          ) : null}

        </section>



        <section className="panel stack">

          <h2 className="panel-title">هشدار و سقف بودجه</h2>

          <div className="field">

            <label htmlFor="thr">آستانه هشدار موجودی کم (ریال)</label>

            <input

              id="thr"

              type="number"

              value={threshold}

              onChange={(e) => setThreshold(e.target.value)}

            />

          </div>

          <div className="field">

            <label htmlFor="cap">سقف بودجه ماهانه (خالی = بدون سقف)</label>

            <input

              id="cap"

              type="number"

              value={cap}

              onChange={(e) => setCap(e.target.value)}

            />

          </div>

          <div className="field">

            <label htmlFor="warn-soft">آستانه هشدار اول بودجه (٪ از سقف)</label>

            <input

              id="warn-soft"

              type="number"

              min={1}

              max={99}

              value={warnSoft}

              onChange={(e) => setWarnSoft(e.target.value)}

            />

          </div>

          <div className="field">

            <label htmlFor="warn-elev">آستانه هشدار نزدیک سقف (٪)</label>

            <input

              id="warn-elev"

              type="number"

              min={1}

              max={99}

              value={warnElevated}

              onChange={(e) => setWarnElevated(e.target.value)}

            />

          </div>

          <p className="meta" style={{ margin: 0 }}>

            پیش‌فرض ۷۰٪ / ۹۰٪ — تا ۱۰۰٪ هنوز مصرف مجاز است؛ ۱۰۰٪ = سقف سخت. کانال اعلان (ایمیل):

            OPEN.

          </p>

          <button

            type="button"

            className="btn btn-secondary"

            onClick={() => {

              const soft = Math.min(99, Math.max(1, Number(warnSoft) || 70))

              const elev = Math.min(99, Math.max(soft + 1, Number(warnElevated) || 90))

              updateWalletSettings({

                lowBalanceThresholdIrr: Number(threshold) || 0,

                monthlyBudgetCapIrr: cap.trim() === '' ? null : Number(cap) || null,

                budgetWarnPctSoft: soft,

                budgetWarnPctElevated: elev,

              })

              setWarnSoft(String(soft))

              setWarnElevated(String(elev))

            }}

          >

            ذخیره تنظیمات (mock)

          </button>

        </section>

      </div>



      <section className="panel" style={{ marginTop: '0.9rem' }}>

        <h2 className="panel-title">رزروهای فعال</h2>

        {wallet.activeReservations.length === 0 ? (

          <p className="meta">رزرو فعالی نیست.</p>

        ) : (

          <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>

            {wallet.activeReservations.map((r) => (

              <li key={r.id} style={{ marginBottom: 8 }}>

                {r.label}

                <div className="meta">

                  {formatIrr(r.amountIrr)} · {r.at}

                </div>

              </li>

            ))}

          </ul>

        )}

      </section>



      <section className="panel" style={{ marginTop: '0.9rem' }}>

        <h2 className="panel-title">تاریخچه شارژ</h2>

        <div className="table-wrap">

          <table className="data">

            <thead>

              <tr>

                <th>زمان</th>

                <th>مبلغ</th>

                <th>روش</th>

              </tr>

            </thead>

            <tbody>

              {wallet.topUpHistory.map((t) => (

                <tr key={t.id}>

                  <td>{t.at}</td>

                  <td>{formatIrr(t.amountIrr)}</td>

                  <td>{t.method}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <p className="meta" style={{ marginBottom: 0 }}>

          <Link to="/account">مصرف و هزینه‌ها از تاریخچه مدل</Link> گزارش هزینه‌ای است — صورت‌حساب per

          درخواست مصرف نداریم.

        </p>

      </section>

    </div>

  )

}


