import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { testFirestoreConnection } from './services/firebase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AddCustomer } from './pages/AddCustomer';
import { CustomerDetails } from './pages/CustomerDetails';
import { EditCustomer } from './pages/EditCustomer';
import { Transactions } from './pages/Transactions';
import { Notifications } from './pages/Notifications';
import { ProfileSettings } from './pages/ProfileSettings';

export default function App() {
  useEffect(() => {
    // Validate Firestore connection on boot as mandated by Firebase skill
    testFirestoreConnection();
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Real-Time Small Finance Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-customer"
          element={
            <ProtectedRoute>
              <AddCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/:id"
          element={
            <ProtectedRoute>
              <CustomerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-customer/:id"
          element={
            <ProtectedRoute>
              <EditCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:customerId"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
