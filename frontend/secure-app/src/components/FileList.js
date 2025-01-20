import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listFiles, 
  downloadFile, 
  shareFile, 
  getFileShares, 
  selectShareLoading,
  selectShareError,
  clearShareError,
  createShareableLink
} from '../store/slices/fileSlice';
import { decryptFile } from '../utils/encryption';
import { Container, Modal, Form, Button, Alert, ListGroup, Row, Col, Card } from 'react-bootstrap';
import Navigation from './Navigation';

const FileList = () => {
  const dispatch = useDispatch();
  const { files, loading, error, shares} = useSelector((state) => state.files);
  const {user, userRole} = useSelector((state) => state.auth);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const shareLoading = useSelector(selectShareLoading);
  const shareError = useSelector(selectShareError);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);

  useEffect(() => {
    dispatch(listFiles());
  }, [dispatch]);

  const handleShare = async (file) => {
    const result = await dispatch(getFileShares(file.id)).unwrap();
    setSelectedFile(file);
    setShowShareModal(true);
  };

  const handleShareLink = async (file) => {
    setSelectedFile(file);
    setGeneratedLink(null);
    setShowLinkModal(true);
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(createShareableLink({
        fileId: selectedFile.id,
        expirationHours: 24,
        permission: sharePermission
      })).unwrap();
      
      setGeneratedLink("http://localhost:3000/share-link/"+result.token);
    } catch (error) {
      alert('Failed to create shareable link');
    }
  };

  // Add useEffect to load shares when a file is selected for sharing
  useEffect(() => {
    if (selectedFile) {
      dispatch(getFileShares(selectedFile.id));
    }
  }, [selectedFile, dispatch]);
  
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(shareFile({
        fileId: selectedFile.id,
        shareData: {
          shared_with_email: shareEmail,
          permission: sharePermission,
        }
      })).unwrap();

      // Refresh the file shares
      await dispatch(getFileShares(selectedFile.id));

      setShowShareModal(false);
      setShareEmail('');
      setSharePermission('view');
      
      // Show success message
      alert('File shared successfully!');
    } catch (error) {
      alert(error || 'Failed to share file');
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await dispatch(downloadFile(fileId)).unwrap();
      // Decrypt the file
      const decryptedBlob = await decryptFile(
        new Blob([response.file]),
        response.encryptedKey,  // Already a Uint8Array
        response.iv            // Already a Uint8Array
      );

      // Create download link
      const url = window.URL.createObjectURL(decryptedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.file_name;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Small delay before cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100)
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePreview = async (fileId) => {
    try {
      const response = await dispatch(downloadFile(fileId)).unwrap();

      const fileName = response.file_name;
      const originalType = response.file_type;

      // Decrypt the file
      const decryptedBlob = await decryptFile(
        new Blob([response.file]),
        response.encryptedKey,  // Already a Uint8Array
        response.iv            // Already a Uint8Array
      );

      const url = window.URL.createObjectURL(decryptedBlob);
  
      // Open preview in new window/tab
      const previewWindow = window.open('', '_blank');

      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>Preview: ${fileName}</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
                .preview-container { max-width: 100%; max-height: 100vh; }
                img, video, audio { max-width: 100%; max-height: 90vh; }
                .pdf-viewer { width: 100vw; height: 100vh; }
              </style>
            </head>
            <body>
              <div class="preview-container">
                ${getPreviewContent(url, originalType, fileName)}
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to preview file');
    }
  };
  
  const getPreviewContent = (url, type, fileName) => {
    if (type.startsWith('image/')) {
      return `<img src="${url}" alt="${fileName}" />`;
    } else if (type.startsWith('video/')) {
      return `<video src="${url}" controls>Your browser does not support video playback.</video>`;
    } else if (type.startsWith('audio/')) {
      return `<audio src="${url}" controls>Your browser does not support audio playback.</audio>`;
    } else if (type === 'application/pdf') {
      return `<iframe src="${url}" class="pdf-viewer" frameborder="0"></iframe>`;
    } else {
      return `<div>Preview not available for this file type.</div>`;
    }
  };

  return (
    <div style={{ backgroundColor: 'whitesmoke', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navigation />

      {/* Main Content */}
      <Container className="py-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        ) : (
          <Row className="g-4">
            {files.length === 0 ? (
              <Col>
                <Alert variant="info">No files uploaded yet.</Alert>
              </Col>
            ) : (
                files.map((file) => (
                  <Col key={file.id} xs={12} sm={6} md={4} lg={3}>
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Body>
                        <Card.Title>{file.file_name}</Card.Title>
                        <Card.Text>
                          <strong>Type:</strong> {file.file_type}<br />
                          <strong>Size:</strong> {formatFileSize(file.file_size)}<br />
                          <strong>Owner:</strong> {file.user.username}<br />
                          <strong>Uploaded:</strong> {new Date(file.uploaded_at).toLocaleDateString()}
                        </Card.Text>
                        <div className="d-grid gap-2">
                          {/* Preview button available for all users */}
                          <Button variant="outline-secondary" onClick={() => handlePreview(file.id)}>
                            <i className="bi bi-eye me-2"></i>
                            Preview
                          </Button>

                          {/* Admin has all permissions */}
                          {userRole === 'admin' && (
                            <>
                              <Button 
                                variant="primary" 
                                onClick={() => handleDownload(file.id)}
                                style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
                              >
                                <i className="bi bi-download me-2"></i>
                                Download
                              </Button>
                              
                              <Button variant="info" onClick={() => handleShare(file)}>
                                <i className="bi bi-share me-2"></i>
                                Share
                              </Button>

                              <Button variant="outline-primary" onClick={() => handleShareLink(file)}>
                                <i className="bi bi-link-45deg me-2"></i>
                                Share Link
                              </Button>
                            </>
                          )}

                          {/* Regular user can only download their own files or files shared with download permission */}
                          {userRole === 'regular' && (
                            <>
                              {(file.user.id === user.id || 
                                (file.shares && file.shares.some(share => 
                                  share.shared_with.id === user.id && 
                                  share.permission === 'download'
                                ))) && (
                                <Button 
                                  variant="primary" 
                                  onClick={() => handleDownload(file.id)}
                                  style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
                                >
                                  <i className="bi bi-download me-2"></i>
                                  Download
                                </Button>
                              )}

                              {file.user.id === user.id && (
                                <>
                                  <Button variant="info" onClick={() => handleShare(file)}>
                                    <i className="bi bi-share me-2"></i>
                                    Share
                                  </Button>

                                  <Button variant="outline-primary" onClick={() => handleShareLink(file)}>
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Share Link
                                  </Button>
                                </>
                              )}
                            </>
                          )}

                          {/* Guest users can only preview */}
                          {userRole === 'guest' && null}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
        )}
      </Container>

      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {shareError && (
            <Alert variant="danger" onClose={() => dispatch(clearShareError())} dismissible>
              {shareError}
            </Alert>
          )}
          
          <Form onSubmit={handleShareSubmit}>
            <Form.Group controlId="formEmail">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className='my-2'
                required
              />
            </Form.Group>

            <Form.Group controlId="formPermission" className="mt-3">
              <Form.Label>Permission Type</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  label="View Only"
                  name="permission"
                  value="view"
                  checked={sharePermission === 'view'}
                  onChange={(e) => setSharePermission(e.target.value)}
                />
                <Form.Check
                  type="radio"
                  label="View and Download"
                  name="permission"
                  value="download"
                  checked={sharePermission === 'download'}
                  onChange={(e) => setSharePermission(e.target.value)}
                />
              </div>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowShareModal(false)}
                disabled={shareLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={shareLoading}
                style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}
              >
                {shareLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sharing...
                  </>
                ) : 'Share'}
              </Button>
            </div>
            <ListGroup>
            {shares.map((share) => (
              <ListGroup.Item key={share.id} className="d-flex justify-content-between align-items-center my-2">
                {share.shared_with.email}
              </ListGroup.Item>
            ))}
          </ListGroup>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Shareable Link Modal */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Shareable Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {generatedLink ? (
            <div>
              <p>Your shareable link has been created:</p>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={generatedLink}
                  readOnly
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                >
                  Copy
                </button>
              </div>
              <small className="text-muted">
                This link will expire in 24 hours.
              </small>
            </div>
          ) : (
            <Form onSubmit={handleCreateLink}>
              <Form.Group controlId="formPermission" className="mt-3">
                  <Form.Label>Permission Type</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="View Only"
                      name="permission"
                      value="view"
                      checked={sharePermission === 'view'}
                      onChange={(e) => setSharePermission(e.target.value)}
                    />
                    <Form.Check
                      type="radio"
                      label="View and Download"
                      name="permission"
                      value="download"
                      checked={sharePermission === 'download'}
                      onChange={(e) => setSharePermission(e.target.value)}
                    />
                  </div>
              </Form.Group>
              <Button type="submit" variant="primary" style={{ backgroundColor: '#E91E63', borderColor: '#E91E63' }}>Create Link</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
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

export default FileList;