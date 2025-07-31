import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import FullScreenLoader from '../components/FullScreenLoader';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
      navigate('/upload');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Query Firestore for any user with the same email
      const usersQuery = await getDocs(collection(db, 'users'));
      const matchingUser = usersQuery.docs.find(
        (doc) => doc.data().email === user.email && doc.id !== user.uid
      );

      if (matchingUser) {
        // Prevent sign-in with different UID but same email
        await auth.signOut();
        toast.error('An account with this email already exists. Please log in using email/password.');
        return;
      }

      // Create Firestore doc if not exists
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          role: 'admin',
          createdAt: new Date()
        });
      }

      toast.success('Google login successful!');
      navigate('/upload');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info('Google sign-in was cancelled.');
      } else {
        toast.error(err.message);
      }
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
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          color: '#f0f0f0'
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontSize: '26px',
            fontWeight: '600',
            color: '#00d0ff'
          }}>
            🔐 UAct Admin Login
          </h2>

          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={{ paddingLeft: '12px' }}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '12px' }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              🔓 Login
            </button>
          </form>

          <hr style={{ margin: '1.8rem 0', borderColor: '#333' }} />

          <button
            className="secondary-btn"
            onClick={handleGoogleLogin}
            style={{ width: '100%' }}
            disabled={loading}
          >
            🚀 Sign in with Google
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            <Link to="/forgot-password" style={{ color: '#00d0ff', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
            <br />
            <Link to="/register" style={{ color: '#00d0ff', textDecoration: 'none' }}>
              Create an Account
            </Link>
          </div>
        </div>
      </div>

      {loading && <FullScreenLoader />}
    </>
  );
}
