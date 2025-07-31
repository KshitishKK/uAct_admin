import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
} from 'react-router-dom';

import UploadPage from './pages/UploadPage';
import ManagePage from './pages/ManagePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PrivateRoute from './components/PrivateRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UserManagementPage from './pages/UserManagementPage';
import ManageCategoriesPage from './pages/ManageCategoriesPage';
import ManageAdvertisersPage from './pages/ManageAdvertisersPage';

import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import './App.css';

function LogoutConfirm({ onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="custom-confirm-alert fade-in">
      <h2>Confirm Logout</h2>
      <p>Are you sure you want to log out?</p>
      <button onClick={handleConfirm} disabled={loading}>
        {loading ? 'Logging out...' : 'Yes'}
      </button>
      <button className="cancel" onClick={onClose} disabled={loading}>
        Cancel
      </button>
    </div>
  );
}

function AppLayout() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = () => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <LogoutConfirm
          onConfirm={async () => {
            await auth.signOut();
            localStorage.removeItem('editVideo');
            toast.success('Logged out successfully!');
            onClose();
            setTimeout(() => {
              navigate('/login');
            }, 300); 
          }}

          onClose={onClose}
        />
      ),
      closeOnClickOutside: false,
    });
  };

  return (
    <div className="admin-container">
      {user && (
        <nav className="sidebar">
          <h2 className="logo">UAct Admin</h2>
          <ul>
            <li>
              <NavLink
                to="/upload"
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                Upload Video
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/manage"
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                Manage Videos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/manage-categories"
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                Manage Categories
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/manage-advertisers"
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                Manage Advertisers
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                Settings
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/users"
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                Users
              </NavLink>
            </li>
          </ul>
          <div className="user-info">
            <p className="user-email">👤 {user.email}</p>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </nav>
      )}

      <main className="main-content">
        <Routes>
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <UploadPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/manage"
            element={
              <PrivateRoute>
                <ManagePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UserManagementPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-categories"
            element={
              <PrivateRoute>
                <ManageCategoriesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-advertisers"
            element={
              <PrivateRoute>
                <ManageAdvertisersPage />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="*"
            element={
              <PrivateRoute>
                <UploadPage />
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}


















// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';

// import UploadPage from './pages/UploadPage';
// import ManagePage from './pages/ManagePage';
// import SettingsPage from './pages/SettingsPage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import ForgotPasswordPage from './pages/ForgotPasswordPage';
// import PrivateRoute from './components/PrivateRoute';
// import UnauthorizedPage from './pages/UnauthorizedPage';
// import UserManagementPage from './pages/UserManagementPage';
// import ManageCategoriesPage from './pages/ManageCategoriesPage';
// import ManageAdvertisersPage from './pages/ManageAdvertisersPage';


// import { auth } from './firebase';
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// import './App.css';

// function AppLayout() {
//   const [user] = useAuthState(auth);
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     auth.signOut().then(() => {
//       localStorage.removeItem('editVideo');
//       toast.success('Logged out successfully!');
//       navigate('/login');
//     });
//   };

//   return (
//     <div className="admin-container">
//       <nav className="sidebar">
//         <h2 className="logo">UAct Admin</h2>
//         <ul>
//           <li><NavLink to="/upload" className={({ isActive }) => isActive ? 'nav-active' : ''}>Upload Video</NavLink></li>
//           <li><NavLink to="/manage" className={({ isActive }) => isActive ? 'nav-active' : ''}>Manage Videos</NavLink></li>
//           <li><NavLink to="/manage-categories" className={({ isActive }) => isActive ? 'nav-active' : ''}>Manage Categories</NavLink></li>
//           <li><NavLink to="/manage-advertisers" className={({ isActive }) => isActive ? 'nav-active' : ''}>Manage Advertisers</NavLink></li>
//           <li><NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-active' : ''}>Settings</NavLink></li>
//           <li><NavLink to="/users" className={({ isActive }) => isActive ? 'nav-active' : ''}>Users</NavLink></li>
//         </ul>


//         {user && (
//           <div className="user-info">
//             <p className="user-email">👤 {user.email}</p>
//             <button className="logout-btn" onClick={handleLogout}>
//               🚪 Logout
//             </button>
//           </div>
//         )}
//       </nav>
//       <main className="main-content">
//         <Routes>
//           <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
//           <Route path="/manage" element={<PrivateRoute><ManagePage /></PrivateRoute>} />
//           <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
//           <Route path="/users" element={<PrivateRoute><UserManagementPage /></PrivateRoute>} />
//           <Route path="/manage-categories" element={<PrivateRoute><ManageCategoriesPage /></PrivateRoute>} />
//           <Route path="/manage-advertisers" element={<PrivateRoute><ManageAdvertisersPage /></PrivateRoute>} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />
//           <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//           <Route path="/unauthorized" element={<UnauthorizedPage />} />
//           <Route path="*" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
//         </Routes>

//         <ToastContainer position="top-right" autoClose={3000} />
//       </main>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <Router>
//       <AppLayout />
//     </Router>
//   );
// }
