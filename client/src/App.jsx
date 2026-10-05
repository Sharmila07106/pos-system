import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import Background from './components/ui/Background';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';
import Users from './pages/Users';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Home from './pages/Home';

function App() {
  return (
    <ThemeProvider>
      <Background />
      <Router>
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'glass-card text-slate-100 border border-slate-700/50',
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
            }
          }} 
        />
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          <Route path="/" element={<MainLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<SalesHistory />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
