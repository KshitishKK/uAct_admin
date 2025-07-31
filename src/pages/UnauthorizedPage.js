import React from 'react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>🚫 Access Denied</h1>
      <p>You are not authorized to access the admin portal.</p>
      <Link to="/login" style={{ color: '#00d0ff' }}>Go to Login</Link>
    </div>
  );
}
