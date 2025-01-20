import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../store/slices/fileSlice';
import { generateEncryptionKey, encryptFile } from '../utils/encryption';
import Navigation from './Navigation';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    
    try {
      // Generate encryption key
      const key = await generateEncryptionKey();
      setUploadProgress(20);
      
      // Encrypt file
      const { encryptedFile, encryptedKey } = await encryptFile(selectedFile, key);
      setUploadProgress(60);
      
      // Create Blob from encryptedKey
      const encryptedKeyBlob = new Blob([encryptedKey], { type: 'application/octet-stream' });
  
      await dispatch(uploadFile({
        file: encryptedFile,
        encryptedKey: encryptedKeyBlob,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      })).unwrap();
      
      setUploadProgress(100);
      setTimeout(() => {
        navigate('/files');
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'whitesmoke', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <i className="bi bi-cloud-upload display-1 text-primary mb-3"></i>
              <h4>Upload Your File</h4>
              <p className="text-muted">
                Select a file to upload. The file will be encrypted before uploading.
              </p>
            </div>

            <div className="row justify-content-center">
              <div className="col-md-8">
                <div className="mb-4">
                  <div className="d-flex justify-content-center">
                    <div className="upload-box p-4 bg-light rounded text-center w-100">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="form-control bg-white"
                        id="fileInput"
                      />
                      {selectedFile && (
                        <div className="mt-3 text-muted">
                          <i className="bi bi-file-earmark me-2"></i>
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="mb-4">
                    <div className="progress" style={{ height: '25px' }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ 
                          width: `${uploadProgress}%`,
                          backgroundColor: '#E91E63'
                        }}
                        aria-valuenow={uploadProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {uploadProgress}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-grid">
                  <button
                    onClick={handleUpload}
                    className="btn btn-primary btn-lg"
                    style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
                    disabled={!selectedFile || loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-arrow-up me-2"></i>
                        Upload File
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileUpload;