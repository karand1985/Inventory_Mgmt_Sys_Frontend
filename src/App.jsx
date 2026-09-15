import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider } from './context/BusinessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusinessSelect from './pages/BusinessSelect';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';

function Home() {
  const { user, isSuperAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // SUPER_ADMIN lands on the business picker (spans both businesses);
  // OWNER/VIEWER go straight to their own dashboard.
  return isSuperAdmin ? <BusinessSelectGate /> : <Navigate to="/dashboard" replace />;
}

// SUPER_ADMIN still needs to pick a business before most screens make sense.
function BusinessSelectGate() {
  return <BusinessSelect />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute requireWrite>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute requireWrite>
              <ProductForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <AppRoutes />
      </BusinessProvider>
    </AuthProvider>
  );
}
