import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './pages/register';
import LoginPage from './pages/login';
import LandingPage from './pages/landing';
import UserDashboard from './pages/dashboard/user';
import CustomerDashboard from './pages/dashboard/customer';
import ProfilePage from './pages/profile/index';
import ChangePasswordPage from './pages/profile/change-password';
import ProductDetailPage from './pages/product/detail';
import QuotationSummaryPage from './pages/quotation/summary';

function App() {
  return (
    <Router>
      <Routes>
  <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
  <Route path="/dashboard/user" element={<UserDashboard />} />
  <Route path="/dashboard/customer" element={<CustomerDashboard />} />
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="/profile/change-password" element={<ChangePasswordPage />} />
  <Route path="/product/:id" element={<ProductDetailPage />} />
  <Route path="/quotation/:id" element={<QuotationSummaryPage />} />
        {/* Add other routes for your application here */}
      </Routes>
    </Router>
  );
}

export default App;