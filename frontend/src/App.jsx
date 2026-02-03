import { Routes, Route } from 'react-router-dom'
import IntakeForm from './pages/IntakeForm'
import CompanyIntake from './pages/CompanyIntake'
import Confirmation from './pages/Confirmation'
import NotFound from './pages/NotFound'
import ExpiredLink from './pages/ExpiredLink'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCompanyEdit from './pages/admin/AdminCompanyEdit'
import AgentWizard from './pages/agent/AgentWizard'
import LinkCodeIntake from './pages/LinkCodeIntake'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Admin routes - must be before /:companySlug */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/companies/new" element={<AdminCompanyEdit />} />
        <Route path="/admin/companies/:id" element={<AdminCompanyEdit />} />
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Agent routes - for Bailbooks agents to send e-sign requests */}
        <Route path="/agent/create" element={<AgentWizard />} />
        
        {/* Link code intake - handles both agent-initiated and client-initiated */}
        <Route path="/:companySlug/:linkCode" element={<LinkCodeIntake />} />
        
        {/* Company slug routes - client starts fresh form */}
        <Route path="/:companySlug" element={<CompanyIntake />} />
        <Route path="/:companySlug/complete" element={<Confirmation />} />
        
        {/* Legacy link code routes (still supported) */}
        <Route path="/i/:linkCode" element={<IntakeForm />} />
        <Route path="/i/:linkCode/complete" element={<Confirmation />} />
        
        {/* Expired link page */}
        <Route path="/expired" element={<ExpiredLink />} />
        
        {/* Home page */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  )
}

// Simple home page
function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          BondProspects
        </h1>
        <p className="text-gray-600 mb-8">
          Bail bond application forms made easy.
        </p>
        <p className="text-sm text-gray-500">
          If your bail bond company gave you a link, please use that link to access your forms.
        </p>
      </div>
    </div>
  )
}

export default App
