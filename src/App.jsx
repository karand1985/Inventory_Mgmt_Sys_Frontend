import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import Navbar from './components/Navbar';
import BusinessSelect from './pages/BusinessSelect';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';

function Home() {
  const { selected } = useBusiness();
  return selected ? <Navigate to="/products" replace /> : <BusinessSelect />;
}

export default function App() {
  return (
    <BusinessProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
      </Routes>
    </BusinessProvider>
  );
}
