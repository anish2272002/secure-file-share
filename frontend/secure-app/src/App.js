import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import ShareLinkPage from './components/ShareLinkPage';
import AuthInitializer from './components/AuthInitializer';

function App() {
  return (
    <Provider store={store}>
      <AuthInitializer />
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/file-upload"
            element={
              <PrivateRoute allowedRoles={['admin', 'regular']}>
                <FileUpload />
              </PrivateRoute>
            }
          />
          <Route path="/files" element={
            <PrivateRoute allowedRoles={['admin', 'regular', 'guest']}>
              <FileList />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/share-link/:token" element={
            <PrivateRoute allowedRoles={['admin', 'regular', 'guest']}>
              <ShareLinkPage />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;