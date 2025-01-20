import React, { useState,useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { verifyLoginMFA } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const MFAVerification = () => {
  const [code, setCode] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { username,isAuthenticated,error } = useSelector((state) => state.auth); 

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await dispatch(verifyLoginMFA({ 
            code,
            username  // Pass username along with code
            })).unwrap();
    } catch (error) {
        console.error('MFA verification failed:', error);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{
           background: 'linear-gradient(to bottom, #E91E63, #9C27B0, #3F51B5)'
         }}>
      <div className="card shadow border-0" style={{ width: '400px' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4">MFA Verification</h2>
          <form onSubmit={handleSubmit}>
            <div className='mb-3'>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength="6"
                autoComplete="123456"
                className="form-control bg-light border-0 py-2 text-center"
                pattern="[0-9]*"
                inputMode="numeric"
                required
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn w-100 text-white mb-3"
              style={{ backgroundColor: '#E91E63' }}
            >
              Verify
            </button>

            <div className="text-center text-muted small">
              Check your authenticator app for the code
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;