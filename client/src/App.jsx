import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import PlatformAdminLayout from './layouts/PlatformAdminLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';
import Users from './pages/Users';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import SupermarketOnboarding from './pages/SupermarketOnboarding';
import ApplicationStatus from './pages/ApplicationStatus';
import ActivateStaff from './pages/ActivateStaff';

// Platform Admin Sub-pages
import Overview from './pages/platform/Overview';
import Applications from './pages/platform/Applications';
import RegisteredStores from './pages/platform/RegisteredStores';
import StaffAccess from './pages/platform/StaffAccess';
import Complaints from './pages/platform/Complaints';
import Reports from './pages/platform/Reports';
import AuditTrail from './pages/platform/AuditTrail';
import Appearance from './pages/platform/Appearance';
import Settings from './pages/platform/Settings';

import RoleRoute from './components/auth/RoleRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0B1B3A',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(11, 27, 58, 0.15)',
              border: '1px solid #12274F',
            },
            success: {
              iconTheme: {
                primary: '#0FA38F',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#E5484D',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboard" element={<SupermarketOnboarding />} />
          <Route path="/application-status" element={<ApplicationStatus />} />
          <Route path="/activate-staff" element={<ActivateStaff />} />

          {/* Platform Admin Routes - Protected for Platform Super Admin & Platform Admin */}
          <Route element={<RoleRoute allowedRoles={['platform_super_admin', 'platform_admin']} />}>
            <Route path="/platform-admin" element={<PlatformAdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="applications" element={<Applications />} />
              <Route path="stores" element={<RegisteredStores />} />
              <Route path="staff" element={<StaffAccess />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="reports" element={<Reports />} />
              <Route path="audit" element={<AuditTrail />} />
              <Route path="appearance" element={<Appearance />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Navigate to="/register" replace />} />
          </Route>

          <Route path="/" element={<MainLayout />}>
            {/* Store Admin Only */}
            <Route element={<RoleRoute allowedRoles={['store_admin', 'store_owner', 'admin']} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
            </Route>

            {/* Cashier Only */}
            <Route element={<RoleRoute allowedRoles={['cashier']} />}>
              <Route path="pos" element={<POS />} />
            </Route>

            {/* Store Admin & Inventory Manager */}
            <Route
              element={
                <RoleRoute
                  allowedRoles={['store_admin', 'store_owner', 'admin', 'inventory_manager']}
                />
              }
            >
              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>

            {/* Store Admin & Cashier */}
            <Route
              element={
                <RoleRoute allowedRoles={['store_admin', 'store_owner', 'admin', 'cashier']} />
              }
            >
              <Route path="sales" element={<SalesHistory />} />
            </Route>

            {/* All Staff */}
            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    'store_admin',
                    'store_owner',
                    'admin',
                    'inventory_manager',
                    'cashier',
                  ]}
                />
              }
            >
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
