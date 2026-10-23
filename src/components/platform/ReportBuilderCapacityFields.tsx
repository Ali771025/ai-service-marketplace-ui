import type {
  NumericCapacityDim,
  ReportBuilderServicePlanCapacity,
  SlaCapacityDim,
  WalletCreditDim,
} from '../../data/reportBuilderPlanCapacity'
import { REPORT_BUILDER_PLATFORM_DEFAULTS } from '../../data/reportBuilderPlanCapacity'

type Props = {
  value: ReportBuilderServicePlanCapacity
  onChange: (next: ReportBuilderServicePlanCapacity) => void
}

function NumericDimRow({
  id,
  label,
  hint,
  dim,
  onChange,
  step = 1,
  unlimitedLabel = 'نامحدود',
}: {
  id: string
  label: string
  hint?: string
  dim: NumericCapacityDim
  onChange: (next: NumericCapacityDim) => void
  step?: number
  unlimitedLabel?: string
}) {
  const unlimited = dim.mode === 'unlimited'
  return (
    <div className="capacity-dim">
      <div className="capacity-dim-head">
        <label htmlFor={`${id}-val`}>{label}</label>
        <label className="toggle-row compact">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { mode: 'unlimited' }
                  : { mode: 'limited', value: dim.mode === 'limited' ? dim.value : 1 },
              )
            }
          />
          {unlimitedLabel}
        </label>
      </div>
      {hint ? <p className="meta capacity-hint">{hint}</p> : null}
      {!unlimited ? (
        <input
          id={`${id}-val`}
          type="number"
          min={0}
          step={step}
          value={dim.mode === 'limited' ? dim.value : 0}
          onChange={(e) =>
            onChange({ mode: 'limited', value: Number(e.target.value) || 0 })
          }
        />
      ) : (
        <p className="meta" style={{ margin: 0 }}>
          بدون سقف روی این بُعد
        </p>
      )}
    </div>
  )
}

function WalletCreditRow({
  dim,
  onChange,
}: {
  dim: WalletCreditDim
  onChange: (next: WalletCreditDim) => void
}) {
  const none = dim.mode === 'none'
  return (
    <div className="capacity-dim">
      <div className="capacity-dim-head">
        <label htmlFor="cap-wallet">شارژ اولیه کیف پول (ریال)</label>
        <label className="toggle-row compact">
          <input
            type="checkbox"
            checked={none}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { mode: 'none' }
                  : { mode: 'limited', value: dim.mode === 'limited' ? dim.value : 500_000 },
              )
            }
          />
          بدون شارژ
        </label>
      </div>
      <p className="meta capacity-hint">اختیاری — بودجه تست سازنده؛ یا بدون شارژ</p>
      {!none ? (
        <input
          id="cap-wallet"
          type="number"
          min={0}
          step={1000}
          value={dim.mode === 'limited' ? dim.value : 0}
          onChange={(e) =>
            onChange({ mode: 'limited', value: Number(e.target.value) || 0 })
          }
        />
      ) : (
        <p className="meta" style={{ margin: 0 }}>
          بدون شارژ اولیه روی این پلن
        </p>
      )}
    </div>
  )
}

function SlaDimRow({
  dim,
  onChange,
}: {
  dim: SlaCapacityDim
  onChange: (next: SlaCapacityDim) => void
}) {
  const unlimited = dim.mode === 'unlimited'
  return (
    <div className="capacity-dim">
      <div className="capacity-dim-head">
        <label htmlFor="cap-sla">SLA (بند سطح خدمت)</label>
        <label className="toggle-row compact">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { mode: 'unlimited' }
                  : { mode: 'text', value: dim.mode === 'text' ? dim.value : '' },
              )
            }
          />
          نامحدود
        </label>
      </div>
      <p className="meta capacity-hint">می‌تواند زمان‌دار باشد — الزام سراسری MVP نیست</p>
      {!unlimited ? (
        <input
          id="cap-sla"
          value={dim.mode === 'text' ? dim.value : ''}
          onChange={(e) => onChange({ mode: 'text', value: e.target.value })}
          placeholder="مثلاً پاسخ تا ۸ ساعت کاری"
        />
      ) : (
        <p className="meta" style={{ margin: 0 }}>
          بدون بند SLA روی این پلن
        </p>
      )}
    </div>
  )
}

/** فرم ابعاد Capacity-Plan-Params برای سرویس کوئری‌ساز */
export function ReportBuilderCapacityFields({ value, onChange }: Props) {
  function patch(partial: Partial<ReportBuilderServicePlanCapacity>) {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="stack capacity-form">
      <div className="meter-note">
        <strong>متر قیمت:</strong> فقط <strong>توکن</strong> — پلتفرم نمونه به ریال تبدیل
        می‌کند. <strong>سقف شمارنده درخواست</strong> بُعد ظرفیت پلن است (نه متر قیمت / قیمت پایه).
      </div>
      <p className="meta" style={{ margin: 0 }}>
        هر بُعد: <strong>نامحدود / بدون سقف</strong> یا <strong>مقدار محدود عددی</strong> — هیچ‌کدام
        الزام سراسری نیست.
      </p>

      <SlaDimRow dim={value.sla} onChange={(sla) => patch({ sla })} />

      <div className="detail-grid two">
        <NumericDimRow
          id="cap-kv"
          label="سقف نسخه دانش"
          dim={value.knowledgeVersionCap}
          onChange={(knowledgeVersionCap) => patch({ knowledgeVersionCap })}
        />
        <NumericDimRow
          id="cap-db"
          label="سقف دیتابیس / محصول"
          dim={value.databaseProductCap}
          onChange={(databaseProductCap) => patch({ databaseProductCap })}
        />
        <NumericDimRow
          id="cap-mi"
          label="سقف شمارنده درخواست"
          hint="سقف فراخوانی ماهانه — بُعد ظرفیت پلن؛ متر قیمت نیست"
          dim={value.monthlyInvokes}
          onChange={(monthlyInvokes) => patch({ monthlyInvokes })}
        />
        <NumericDimRow
          id="cap-rpm"
          label="نرخ در دقیقه"
          hint="می‌تواند نامحدود باشد"
          dim={value.rpm}
          onChange={(rpm) => patch({ rpm })}
        />
        <NumericDimRow
          id="cap-kb"
          label="فضای دانش (گیگابایت)"
          dim={value.knowledgeStorageGb}
          onChange={(knowledgeStorageGb) => patch({ knowledgeStorageGb })}
          step={0.5}
        />
        <WalletCreditRow
          dim={value.initialWalletCredit}
          onChange={(initialWalletCredit) => patch({ initialWalletCredit })}
        />
      </div>

      <div className="capacity-dim">
        <h3 className="panel-subtitle">صف کلید دسترسی روی پلن</h3>
        <p className="meta capacity-hint">
          نمونه پیش‌فرض پلتفرم: هم‌زمانی{' '}
          {REPORT_BUILDER_PLATFORM_DEFAULTS.maxConcurrentPerIdentity} به ازای هویت · کلید فعال{' '}
          {REPORT_BUILDER_PLATFORM_DEFAULTS.maxActiveApiKeysPerModel} به ازای مدل و هویت — روی پلن هر
          کدام نامحدود یا عدد محدود.
        </p>
        <div className="detail-grid two">
          <NumericDimRow
            id="cap-conc"
            label="سقف هم‌زمانی (به ازای هویت)"
            hint={`نمونه پیش‌فرض پلتفرم: ${REPORT_BUILDER_PLATFORM_DEFAULTS.maxConcurrentPerIdentity}`}
            dim={value.maxConcurrentPerIdentity}
            onChange={(maxConcurrentPerIdentity) => patch({ maxConcurrentPerIdentity })}
          />
          <NumericDimRow
            id="cap-keys"
            label="سقف کلید فعال (به ازای مدل و هویت)"
            hint={`نمونه پیش‌فرض پلتفرم: ${REPORT_BUILDER_PLATFORM_DEFAULTS.maxActiveApiKeysPerModel}`}
            dim={value.maxActiveApiKeysPerModel}
            onChange={(maxActiveApiKeysPerModel) => patch({ maxActiveApiKeysPerModel })}
          />
        </div>
      </div>
    </div>
  )
}
