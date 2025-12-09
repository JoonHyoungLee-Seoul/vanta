import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EnrollmentProvider } from './context/EnrollmentContext';
import InviteCode from './pages/InviteCode';
import Login from './pages/Login';
import NameInput from './pages/NameInput';
import BirthdayInput from './pages/BirthdayInput';
import PhoneInput from './pages/PhoneInput';
import UserIdInput from './pages/UserIdInput';
import PasswordInput from './pages/PasswordInput';
import Splash from './pages/Splash';
import PartyList from './pages/PartyList';
import EventDetail from './pages/EventDetail';
import Payment from './pages/Payment';
import Enrolled from './pages/Enrolled';
import Coupon from './pages/Coupon';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <EnrollmentProvider>
      <Router>
        <div className="app-container">
          <div className="phone-frame">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/invite" element={<InviteCode />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/name" element={<NameInput />} />
              <Route path="/register/birthday" element={<BirthdayInput />} />
              <Route path="/register/phone" element={<PhoneInput />} />
              <Route path="/register/userid" element={<UserIdInput />} />
              <Route path="/register/password" element={<PasswordInput />} />
              <Route path="/parties" element={<PartyList />} />
              <Route path="/party/:id" element={<EventDetail />} />
              <Route path="/payment/:id" element={<Payment />} />
              <Route path="/enrolled" element={<Enrolled />} />
              <Route path="/coupon" element={<Coupon />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </div>
      </Router>
    </EnrollmentProvider>
  );
}

export default App;
