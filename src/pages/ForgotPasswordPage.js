import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f1f1f 0%, #121212 100%)',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#1e1e1e',
        padding: '2.5rem',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        color: '#f0f0f0'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          fontSize: '26px',
          fontWeight: '600',
          color: '#00d0ff'
        }}>
          🔐 Forgot Password
        </h2>

        <form onSubmit={handleReset}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              style={{ paddingLeft: '12px' }}
            />
          </div>

          <button type="submit" className="primary-btn" style={{ width: '100%' }}>
            Send Reset Link
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: '#00d0ff', textDecoration: 'none' }}>
            🔙 Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
