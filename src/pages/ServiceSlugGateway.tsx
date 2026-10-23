import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useMockStore } from '../data/MockStore'
import { PageHeader } from '../components/ui/Primitives'
import { Link } from 'react-router-dom'

/** مسیر عمومی اختصاصی نمونه: /service/reporter-behsaz → فضای مدیریت همان Instance */
export function ServiceSlugGateway() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const { creatorInstances } = useMockStore()
  const instance = creatorInstances.find((i) => i.pathSlug === slug)

  if (!instance) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <PageHeader
            title="آدرس سرویس یافت نشد"
            description={`نامک «${slug}» به هیچ نمونه خریداری‌شده‌ای وصل نیست.`}
          />
          <Link className="btn btn-primary" to="/account">
            میز کار حساب
          </Link>
        </div>
      </div>
    )
  }

  const rest = location.pathname.replace(/^\/service\/[^/]+/, '') || ''
  const target = `/account/services/${instance.id}${rest}${location.search}`
  return <Navigate to={target} replace />
}
