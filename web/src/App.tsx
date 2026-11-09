import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'

const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })))

// Public
const EmpleoPage = page(() => import('@/pages/empleo/EmpleoPage'), 'EmpleoPage')
const JobBoardPage = page(() => import('@/pages/empleo/JobBoardPage'), 'JobBoardPage')
const JobDetailPage = page(() => import('@/pages/empleo/JobDetailPage'), 'JobDetailPage')
const EmployerPricingPage = page(() => import('@/pages/empleo/EmployerPricingPage'), 'EmployerPricingPage')
const ObrasPage = page(() => import('@/pages/obras/ObrasPage'), 'ObrasPage')
const CompaniesPage = page(() => import('@/pages/obras/CompaniesPage'), 'CompaniesPage')
const ProviderPricingPage = page(() => import('@/pages/obras/ProviderPricingPage'), 'ProviderPricingPage')
const LoginPage = page(() => import('@/pages/auth/LoginPage'), 'LoginPage')
const RegisterPage = page(() => import('@/pages/auth/RegisterPage'), 'RegisterPage')
const NotFoundPage = page(() => import('@/pages/NotFoundPage'), 'NotFoundPage')

// Shared, signed in
const MessagesPage = page(() => import('@/pages/MessagesPage'), 'MessagesPage')
const AccountPage = page(() => import('@/pages/AccountPage'), 'AccountPage')
const SimulatedPaymentPage = page(() => import('@/pages/PaymentPages'), 'SimulatedPaymentPage')
const PaymentReturnPage = page(() => import('@/pages/PaymentPages'), 'PaymentReturnPage')
const PaymentCancelPage = page(() => import('@/pages/PaymentPages'), 'PaymentCancelPage')

// Empleo: workers
const WorkerHomePage = page(() => import('@/pages/worker/WorkerHomePage'), 'WorkerHomePage')
const WorkerProfilePage = page(() => import('@/pages/worker/WorkerProfilePage'), 'WorkerProfilePage')
// Empleo: employers
const EmployerHomePage = page(() => import('@/pages/employer/EmployerHomePage'), 'EmployerHomePage')
const JobFormPage = page(() => import('@/pages/employer/JobFormPage'), 'JobFormPage')
const ApplicantsPage = page(() => import('@/pages/employer/ApplicantsPage'), 'ApplicantsPage')
const WorkerDirectoryPage = page(() => import('@/pages/employer/WorkerDirectoryPage'), 'WorkerDirectoryPage')
const EmployerProfilePage = page(() => import('@/pages/employer/EmployerProfilePage'), 'EmployerProfilePage')
const BillingPage = page(() => import('@/pages/BillingPage'), 'BillingPage')
// Obras: clients
const ClientHomePage = page(() => import('@/pages/client/ClientHomePage'), 'ClientHomePage')
const ProjectFormPage = page(() => import('@/pages/client/ProjectFormPage'), 'ProjectFormPage')
const ProjectPage = page(() => import('@/pages/client/ProjectPage'), 'ProjectPage')
// Obras: providers
const LeadsPage = page(() => import('@/pages/provider/LeadsPage'), 'LeadsPage')
const LeadPage = page(() => import('@/pages/provider/LeadPage'), 'LeadPage')
const UnlockedLeadsPage = page(() => import('@/pages/provider/UnlockedLeadsPage'), 'UnlockedLeadsPage')
const ProviderProfilePage = page(() => import('@/pages/provider/ProviderProfilePage'), 'ProviderProfilePage')
// Owner
const AdminPage = page(() => import('@/pages/admin/AdminPage'), 'AdminPage')

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* ── Empleo, public ── */}
          <Route path="/empleo" element={<EmpleoPage />} />
          <Route path="/empleo/ofertas" element={<JobBoardPage />} />
          <Route path="/empleo/ofertas/:id" element={<JobDetailPage />} />
          <Route path="/empleo/empresas" element={<EmployerPricingPage />} />

          {/* ── Obras, public ── */}
          <Route path="/obras" element={<ObrasPage />} />
          <Route path="/obras/empresas" element={<CompaniesPage />} />
          <Route path="/obras/profesionales" element={<ProviderPricingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/mensajes" element={<MessagesPage />} />
            <Route path="/mensajes/:id" element={<MessagesPage />} />
            <Route path="/cuenta" element={<AccountPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['employer', 'provider']} />}>
            <Route path="/pago/simulado/:id" element={<SimulatedPaymentPage />} />
            <Route path="/pago/ok" element={<PaymentReturnPage />} />
            <Route path="/pago/cancelado" element={<PaymentCancelPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['worker']} />}>
            <Route path="/trabajador" element={<WorkerHomePage />} />
            <Route path="/trabajador/perfil" element={<WorkerProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['employer']} />}>
            <Route path="/empresa" element={<EmployerHomePage />} />
            <Route path="/empresa/ofertas/nueva" element={<JobFormPage />} />
            <Route path="/empresa/ofertas/:id" element={<ApplicantsPage />} />
            <Route path="/empresa/ofertas/:id/editar" element={<JobFormPage />} />
            <Route path="/empresa/candidatos" element={<WorkerDirectoryPage />} />
            <Route path="/empresa/plan" element={<BillingPage />} />
            <Route path="/empresa/perfil" element={<EmployerProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['client']} />}>
            <Route path="/cliente" element={<ClientHomePage />} />
            <Route path="/cliente/solicitudes/nueva" element={<ProjectFormPage />} />
            <Route path="/cliente/solicitudes/:id" element={<ProjectPage />} />
            <Route path="/cliente/solicitudes/:id/editar" element={<ProjectFormPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['provider']} />}>
            <Route path="/profesional" element={<LeadsPage />} />
            <Route path="/profesional/solicitudes/:id" element={<LeadPage />} />
            <Route path="/profesional/clientes" element={<UnlockedLeadsPage />} />
            <Route path="/profesional/creditos" element={<BillingPage />} />
            <Route path="/profesional/perfil" element={<ProviderProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
