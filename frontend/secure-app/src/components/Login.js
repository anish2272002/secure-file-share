import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { sanitizeInput } from '../utils/sanitize';
import { useNavigate, Link } from 'react-router-dom';
import MFAVerification from './MFAVerification';

const Login = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, mfaRequired } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const sanitizedValues = {
        username: sanitizeInput(formData.username),
        password: formData.password // Don't sanitize password
      };
      await dispatch(login(sanitizedValues)).unwrap();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  if (mfaRequired) {
    return <MFAVerification />;
  }
  
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{
           background: 'linear-gradient(to bottom, #E91E63, #9C27B0, #3F51B5)'
         }}>
      <div className="card shadow border-0" style={{ width: '400px' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4">LOGIN</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="form-control bg-light border-0 py-2"
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="form-control bg-light border-0 py-2"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Show error from Redux state */}
            {error && (
              <div className="alert alert-danger p-2 mb-3" role="alert">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn w-100 text-white my-3" 
              style={{ backgroundColor: '#E91E63' }} 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center" style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Not a member? {' '}
              <Link 
                to="/register" 
                className="text-decoration-none"
                style={{ color: '#E91E63' }}
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 