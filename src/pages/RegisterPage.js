import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import FullScreenLoader from '../components/FullScreenLoader';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();



const handleRegister = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error('Email and password are required');
    return;
  }

  if (password.length < 6) {
    toast.error('Password must be at least 6 characters long');
    return;
  }

  setLoading(true);

  try {
    // Check if email already in use
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      toast.error('This email is already registered. Please log in instead.');
      setLoading(false);
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      role: 'admin',
      createdAt: new Date()
    });

    toast.success('Account created! Please log in.');
    navigate('/login');
  } catch (err) {
    console.error('Registration error:', err);
    toast.error(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};


  return (
    <>
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
            📝 Create Admin Account
          </h2>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ paddingLeft: '12px' }}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password (min 6 characters)</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
                style={{ paddingLeft: '12px' }}
                disabled={loading}
              />
            </div>

            <button className="primary-btn" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#00d0ff', textDecoration: 'none' }}>
              Log in
            </Link>
            
          </div>
        </div>
      </div>

      {loading && <FullScreenLoader />}
    </>
  );
}
