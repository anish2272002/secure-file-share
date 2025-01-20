import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MFASetup from './MFASetup';
import Navigation from './Navigation';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useSelector((state) => state.auth);

  const handleFileUpload = () => {
    navigate('/file-upload');
  };

  const handleViewFiles = () => {
    navigate('/files');
  };

  const handleAdminPanel = () => {
    window.open('https://localhost:8000/admin', '_blank');
  };

  const renderRoleSpecificContent = () => {
    switch (userRole) {
      case 'admin':
        return (
          <>
          {/* File Management Card */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-file-earmark-text h3 mb-0 text-primary me-2"></i>
                  <h5 className="card-title mb-0">File Management</h5>
                </div>
                <p className="card-text text-muted mb-3">
                  Upload and manage your encrypted files securely
                </p>
                <div className="d-grid gap-2">
                  <button 
                    onClick={handleFileUpload}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
                  >
                    <i className="bi bi-cloud-upload me-2"></i>
                    Upload Files
                  </button>
                  <button 
                    onClick={handleViewFiles}
                    className="btn btn-outline-secondary"
                  >
                    <i className="bi bi-folder me-2"></i>
                    View Files
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Controls Card */}
          <div className="col-12 col-md-6 col-xl-3">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-gear h3 mb-0 text-primary me-2"></i>
                    <h5 className="card-title mb-0">Admin Controls</h5>
                  </div>
                  <p className="card-text text-muted mb-3">
                    Manage users and system settings
                  </p>
                  <div className="d-grid">
                    <button 
                      onClick={handleAdminPanel}
                      className="btn btn-primary"
                      style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
                    >
                      <i className="bi bi-gear me-2"></i>
                      Open Admin Panel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'regular':
        return (
          <>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-file-earmark-text h3 mb-0 text-primary me-2"></i>
                    <h5 className="card-title mb-0">File Management</h5>
                  </div>
                  <p className="card-text text-muted mb-3">
                    Upload and manage your encrypted files securely
                  </p>
                  <div className="d-grid gap-2">
                    <button 
                      onClick={handleFileUpload}
                      className="btn btn-primary"
                      style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
                    >
                      <i className="bi bi-cloud-upload me-2"></i>
                      Upload Files
                    </button>
                    <button 
                      onClick={handleViewFiles}
                      className="btn btn-outline-secondary"
                    >
                      <i className="bi bi-folder me-2"></i>
                      View Files
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'guest':
        return (
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-share h3 mb-0 text-primary me-2"></i>
                  <h5 className="card-title mb-0">Shared Files</h5>
                </div>
                <p className="card-text text-muted mb-3">
                  View files shared with you
                </p>
                <div className="d-grid">
                  <button 
                    onClick={handleViewFiles}
                    className="btn btn-outline-secondary"
                  >
                    <i className="bi bi-folder my-2 me-2"></i>
                    View Files
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ backgroundColor: 'whitesmoke', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        {/* Welcome Card */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h4 className="card-title mb-1">Welcome back!</h4>
            <p className="card-text text-muted">
              <i className="bi bi-envelope me-2"></i>
              {user.email}
            </p>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="row g-4">
          {/* 2FA Card */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-shield-lock h3 mb-0 text-primary me-2"></i>
                  <h5 className="card-title mb-0">Two-Factor Authentication</h5>
                </div>
                <MFASetup />
              </div>
            </div>
          </div>

          {renderRoleSpecificContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 