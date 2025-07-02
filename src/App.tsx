
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BookingProvider } from "./contexts/BookingContext";

// Layout
import Layout from "./components/layout/Layout";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Auth Components
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import EmailVerification from "./components/auth/EmailVerification";
import ResendVerification from "./components/auth/ResendVerification";

// Booking Components
import BookingCalendar from "./components/booking/BookingCalendar";
import UserBookings from "./components/booking/UserBookings";
import BookingDetails from "./components/booking/BookingDetails";
import BookingDetailsAdmin from "./components/booking/BookingDetailsAdmin";
import AdminUserBookings from "./components/booking/AdminUserBookings";

// Admin Components
import AdminPanel from "./components/admin/AdminPanel";

// Payment Components
import PaymentForm from "./components/payment/PaymentForm";
import BookingConfirmation from "./components/payment/BookingConfirmation";
import ApiHealthCheck from "./components/debug/ApiHealthCheck";

const queryClient = new QueryClient();

// Private Route component for authenticated routes
const PrivateRoute = ({ element, adminOnly = false }: { element: JSX.Element; adminOnly?: boolean }) => {
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return element;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BookingProvider>
          <Toaster />
          <Sonner />
          {/* Only show debug component in development */}
          {import.meta.env.DEV && <ApiHealthCheck />}
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Booking Routes */}
              <Route path="/booking" element={<Layout><BookingCalendar /></Layout>} />
              <Route path="/payment/:bookingId" element={<Layout><PaymentForm /></Layout>} />
              <Route path="/confirmation/:bookingId" element={<Layout><BookingConfirmation /></Layout>} />
              <Route path="/booking/:bookingId" element={<Layout><BookingDetails /></Layout>} />

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={<PrivateRoute element={<Layout><Dashboard /></Layout>} />} 
              />
              <Route 
                path="/my-bookings" 
                element={<PrivateRoute element={<Layout><UserBookings /></Layout>} />} 
              />
              <Route 
                path="/admin" 
                element={<PrivateRoute element={<Layout><AdminPanel /></Layout>} adminOnly={true} />} 
              />
              <Route 
                path="/admin/booking/:bookingId" 
                element={<PrivateRoute element={<Layout><BookingDetailsAdmin /></Layout>} adminOnly={true} />} 
              />
              <Route 
                path="/admin/bookings" 
                element={<PrivateRoute element={<Layout><AdminUserBookings /></Layout>} adminOnly={true} />} 
              />
              
              {/* Catch-all Route */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
              
            </Routes>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
