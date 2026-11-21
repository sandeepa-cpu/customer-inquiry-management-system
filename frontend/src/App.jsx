import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth } from './auth/RequireAuth.jsx';
import { Layout } from './components/Layout.jsx';
import { CreateInquiryPage } from './pages/CreateInquiryPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { InquiryDetailPage } from './pages/InquiryDetailPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inquiries/new" element={<CreateInquiryPage />} />
        <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
