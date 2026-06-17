import { Navigate, Route, Routes } from 'react-router-dom'
import CreatePolicyPage from './pages/CreatePolicyPage'
import EditPolicyPage from './pages/EditPolicyPage'
import PolicyEventsPage from './pages/PolicyEventsPage'
import PolicyListPage from './pages/PolicyListPage'
import ViewPolicyPage from './pages/ViewPolicyPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/policies" replace />} />

      <Route path="/policies" element={<PolicyListPage />} />
      <Route path="/policies/create" element={<CreatePolicyPage />} />
      <Route path="/policies/view/:id" element={<ViewPolicyPage />} />
      <Route path="/policies/edit/:id" element={<EditPolicyPage />} />
      <Route
        path="/policies/:id/events"
        element={<PolicyEventsPage />}
      />
    </Routes>
  )
}

export default App