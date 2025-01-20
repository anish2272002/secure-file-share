import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useDispatch, useSelector } from 'react-redux';
import { setupMFA, verifyMFA } from '../store/slices/authSlice';

const MFASetup = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const { user, mfaSecret, mfaQrCode, loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleSetupMFA = async () => {
    try {
      await dispatch(setupMFA()).unwrap();
    } catch (error) {
      console.error('MFA setup failed:', error);
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    try {
      await dispatch(verifyMFA({ code: verificationCode })).unwrap();
    } catch (error) {
      console.error('MFA verification failed:', error);
    }
  };

  return (
    <div>
      {!user.mfaEnabled && !mfaSecret && (
        <div className="d-grid">
          <button 
            onClick={handleSetupMFA}
            className="btn btn-primary w-100"
            style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
            disabled={loading}
          >
            <i className="bi bi-shield-lock me-2"></i>
            Enable 2FA
          </button>
        </div>
      )}

      {mfaSecret && !user.mfaEnabled && (
        <div>
          <p className="text-muted mb-3">
            <i className="bi bi-info-circle me-2"></i>
            Scan this QR code with your authenticator app
          </p>
          
          <div className="text-center mb-3 p-3 bg-light rounded">
            <QRCodeSVG 
              value={mfaQrCode} 
              size={180}
              className="img-fluid"
            />
          </div>
          
          <div className="mb-3">
            <p className="text-muted small mb-2">
              <i className="bi bi-key me-2"></i>
              Or enter this code manually:
            </p>
            <code className="user-select-all bg-light p-2 rounded d-block">
              {mfaSecret}
            </code>
          </div>
          
          <form onSubmit={handleVerifyMFA}>
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-light border-0">
                  <i className="bi bi-123"></i>
                </span>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="form-control bg-light border-0"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-100"
              style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2"></i>
                  Verify
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {user.mfaEnabled && (
        <div className="text-success">
          <div className="d-flex align-items-center">
            <i className="bi bi-shield-check h4 mb-0 me-2"></i>
            <p className="mb-0">2FA is enabled for your account</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFASetup;