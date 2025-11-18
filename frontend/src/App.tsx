import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components';
import { DashboardLayout } from './components/layout';
import { Toaster } from './components/ui/sonner';

// Page (sẽ tạo sau)
function LoginPage() {
  return <div>Login Page (Coming soon)</div>;
}

function RegisterPage() {
  return <div>Register Page (Coming soon)</div>;
}

function FilesPage() {
  return <div>Files Page (Coming soon)</div>;
}

function SharedPage() {
  return <div>Shared Files Page (Coming soon)</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/files" replace />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="shared" element={<SharedPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
