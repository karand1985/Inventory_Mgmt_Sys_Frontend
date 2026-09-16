import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider } from './context/BusinessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { PromptProvider } from './context/PromptContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalHandlers from './components/GlobalHandlers';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusinessSelect from './pages/BusinessSelect';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import ImageSearch from './pages/ImageSearch';
import CatalogSettings from './pages/CatalogSettings';
import Businesses from './pages/Businesses';
import ChangePassword from './pages/ChangePassword';
import Users from './pages/Users';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Everyone lands on the dashboard. The dashboard route requires a selected
  // business, so SUPER_ADMIN (multi-business) is bounced to the picker first,
  // while OWNER/VIEWER (single business) auto-select and go straight through.
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <>
      <GlobalHandlers />
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route
          path="/select-business"
          element={
            <ProtectedRoute>
              <BusinessSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireBusiness>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute requireBusiness>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute requireWrite requireBusiness>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute requireBusiness>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute requireWrite requireBusiness>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/images"
          element={
            <ProtectedRoute requireBusiness>
              <ImageSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute requireWrite requireBusiness>
              <CatalogSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/businesses"
          element={
            <ProtectedRoute requireSuperAdmin>
              <Businesses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireSuperAdmin>
              <Users />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <PromptProvider>
          <AuthProvider>
            <BusinessProvider>
              <AppRoutes />
            </BusinessProvider>
          </AuthProvider>
        </PromptProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
