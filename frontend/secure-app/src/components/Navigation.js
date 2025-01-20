import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { Navbar, Nav, Container } from 'react-bootstrap';

const Navigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userRole } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/">ShareSafe</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
            {userRole === 'admin' && (
              <>
              <a 
                href="https://localhost:8000/admin" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="nav-link"
              >
                Admin
              </a>
              <Nav.Link as={Link} to="/file-upload">Upload File</Nav.Link>
              <Nav.Link as={Link} to="/files">All Files</Nav.Link>
              </>
            )}
            {userRole === 'regular' && (
              <>
              <Nav.Link as={Link} to="/file-upload">Upload File</Nav.Link>
              <Nav.Link as={Link} to="/files">My Files</Nav.Link>
              </>
            )}
            {userRole === 'guest' && (
              <Nav.Link as={Link} to="/files">Shared Files</Nav.Link>
            )}
          </Nav>
          <Nav>
            <Nav.Link onClick={handleLogout} className="text-danger">
              <i className="bi bi-box-arrow-right me-2"></i> {/* Logout icon */}
              Logout
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;