import { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";

const Submit = lazy(() => import("./pages/Submit.jsx"));
const ClaimDetail = lazy(() => import("./pages/ClaimDetail.jsx"));
const VerifyQueue = lazy(() => import("./pages/VerifyQueue.jsx"));
const VerifyDetail = lazy(() => import("./pages/VerifyDetail.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.jsx"));

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-label="Loading">
      <span className="route-fallback-spinner" />
    </div>
  );
}

function RouteProgress() {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      className="route-progress"
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  );
}

function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <RouteProgress />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          id="main"
          className="page-main"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/submit"
                element={
                  <ProtectedRoute>
                    <Submit />
                  </ProtectedRoute>
                }
              />
              <Route path="/claim/:id" element={<ClaimDetail />} />
              <Route
                path="/verify"
                element={
                  <ProtectedRoute>
                    <VerifyQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify/:id"
                element={
                  <ProtectedRoute>
                    <VerifyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
