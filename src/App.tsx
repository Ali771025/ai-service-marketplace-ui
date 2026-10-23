import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './auth/RequireAuth'
import { useAuth } from './auth/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { WalletPage } from './pages/WalletPage'
import {
  AccountHubPage,
  AccountProfilePage,
} from './pages/account/AccountHubPage'
import { AccountExceptionsPage } from './pages/account/AccountExceptionsPage'
import {
  BuyPlansPage,
  ServiceEarningsPage,
  ServiceHomePage,
  ServiceKnowledgePage,
  ServiceMarkupPage,
  ServiceModelsPage,
  ServiceSupportPlansPage,
  ServiceTicketsPage,
  ServiceSqlTesterPage,
  ServiceUsagePage,
} from './pages/account/ServiceSpacePages'
import {
  AccountDiscoverPage,
  AccountRequestDetailPage,
  ModelBuySupportPage,
  ModelComplaintPage,
  ModelHistoryPage,
  ModelHowItWorksPage,
  ModelConnectGuidePage,
  ModelRequestPage,
  ModelSupportPage,
  ModelUsageSummaryPage,
  ModelUseHomePage,
} from './pages/account/ModelUsePages'
import { ConsumerInvoicesPage } from './pages/consumer/InvoicesAndSupport'
import {
  PlatformAuditPage,
  PlatformDashboardPage,
  PlatformOrdersPage,
  PlatformPayoutRulesPage,
  PlatformProvisioningRedirectPage,
  PlatformReportsPage,
  PlatformRevenuePage,
  PlatformServiceDetailPage,
  PlatformServicePlansPage,
  PlatformServicesPage,
  PlatformSupportFrameworkPage,
} from './pages/platform/PlatformPages'
import { PlatformExceptionsPage } from './pages/platform/PlatformOpsPages'
import {
  PlatformTicketsQueuePage,
  PlatformUsersPage,
  PlatformOrgPeersPage,
  PlatformPlansOverviewPage,
  PlatformVersionsPage,
  PlatformSettingsPage,
  PlatformPayoutOverviewPage,
  PlatformExecutionMetricsPage,
} from './pages/platform/PlatformExpandedPages'
import { AccountMembersPage } from './pages/account/AccountMembersPage'
import { ServiceSlugGateway } from './pages/ServiceSlugGateway'

function HomeRedirect() {
  const { isAuthenticated, homePath } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={homePath} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route index element={<HomeRedirect />} />

      {/* آدرس اختصاصی نمونه سرویس — Confirmed-Decisions */}
      <Route
        path="/service/:slug/*"
        element={
          <RequireAuth roles={['consumer', 'creator']}>
            <ServiceSlugGateway />
          </RequireAuth>
        }
      />

      {/* —— حساب کاربری / میز کار —— */}
      <Route
        path="/account"
        element={
          <RequireAuth roles={['consumer', 'creator']}>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<AccountHubPage />} />
        <Route path="profile" element={<AccountProfilePage />} />
        <Route path="members" element={<AccountMembersPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="invoices" element={<ConsumerInvoicesPage />} />
        <Route path="exceptions" element={<AccountExceptionsPage />} />
        <Route path="discover" element={<AccountDiscoverPage />} />
        <Route path="buy-plans" element={<BuyPlansPage />} />

        <Route path="services/:instanceId" element={<ServiceHomePage />} />
        <Route path="services/:instanceId/models" element={<ServiceModelsPage />} />
        <Route path="services/:instanceId/markup" element={<ServiceMarkupPage />} />
        <Route
          path="services/:instanceId/support-plans"
          element={<ServiceSupportPlansPage />}
        />
        <Route path="services/:instanceId/knowledge" element={<ServiceKnowledgePage />} />
        <Route path="services/:instanceId/sql-tester" element={<ServiceSqlTesterPage />} />
        <Route path="services/:instanceId/earnings" element={<ServiceEarningsPage />} />
        <Route path="services/:instanceId/tickets" element={<ServiceTicketsPage />} />
        <Route path="services/:instanceId/usage" element={<ServiceUsagePage />} />

        <Route path="models/:modelId" element={<ModelUseHomePage />} />
        <Route path="models/:modelId/request" element={<ModelRequestPage />} />
        <Route path="models/:modelId/history" element={<ModelHistoryPage />} />
        <Route path="models/:modelId/support" element={<ModelSupportPage />} />
        <Route path="models/:modelId/usage" element={<ModelUsageSummaryPage />} />
        <Route path="models/:modelId/buy-support" element={<ModelBuySupportPage />} />
        <Route path="models/:modelId/how-it-works" element={<ModelHowItWorksPage />} />
        <Route path="models/:modelId/connect-guide" element={<ModelConnectGuidePage />} />
        <Route path="models/:modelId/complaint" element={<ModelComplaintPage />} />
        <Route path="requests/:requestId" element={<AccountRequestDetailPage />} />
      </Route>

      {/* —— پلتفرم (مدیرعامل) —— */}
      <Route
        path="/platform"
        element={
          <RequireAuth roles={['platform']}>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<PlatformDashboardPage />} />
        <Route path="services" element={<PlatformServicesPage />} />
        <Route path="services/:serviceId" element={<PlatformServiceDetailPage />} />
        <Route path="services/:serviceId/:section" element={<PlatformServiceDetailPage />} />
        <Route path="provisioning" element={<PlatformProvisioningRedirectPage />} />
        <Route path="service-plans" element={<PlatformServicePlansPage />} />
        <Route path="support-framework" element={<PlatformSupportFrameworkPage />} />
        <Route path="payout-rules" element={<PlatformPayoutRulesPage />} />
        <Route path="orders" element={<PlatformOrdersPage />} />
        <Route path="exceptions" element={<PlatformExceptionsPage />} />
        <Route path="tickets" element={<PlatformTicketsQueuePage />} />
        <Route path="users" element={<PlatformUsersPage />} />
        <Route path="org-peers" element={<PlatformOrgPeersPage />} />
        <Route path="plans" element={<PlatformPlansOverviewPage />} />
        <Route path="versions" element={<PlatformVersionsPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
        <Route path="revenue" element={<PlatformRevenuePage />} />
        <Route path="payouts" element={<PlatformPayoutOverviewPage />} />
        <Route path="reports" element={<PlatformReportsPage />} />
        <Route path="execution-metrics" element={<PlatformExecutionMetricsPage />} />
        <Route path="audit" element={<PlatformAuditPage />} />
      </Route>

      {/* سازگاری مسیرهای قدیمی → حساب */}
      <Route path="/consumer/*" element={<Navigate to="/account" replace />} />
      <Route path="/creator/*" element={<Navigate to="/account" replace />} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
