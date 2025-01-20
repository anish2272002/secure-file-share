import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Container } from 'react-bootstrap';
import Navigation from './Navigation';
import api from '../utils/axiosConfig';

const API_URL = `https://${process.env.REACT_APP_APP_HOST}:${process.env.REACT_APP_APP_PORT}/storage`;

const ShareLinkPage = () => {
  const { token } = useParams(); // Get the token from the URL
  const [fileShareDetails, setFileShareDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isFetched, setIsFetched] = useState(false); // Track if data has been fetched

  useEffect(() => {
    const fetchFileShareDetails = async () => {
      if (isFetched) return; // Prevent fetching if already fetched

      try {
        const response = await api.get(`${API_URL}/share/link/${token}`);
        setFileShareDetails(response.data);
        setIsFetched(true); // Mark as fetched
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch file share details');
      }
    };

    fetchFileShareDetails();
  }, [token, isFetched]); // Add isFetched to the dependency array

  return (
    <>
      <Navigation />
      <Container className="mt-5">
        {error && <Alert variant="danger">{error}</Alert>}
        {fileShareDetails ? (
          <div>
            <h2>File Shared Successfully!</h2>
            <p>File Name: {fileShareDetails.file.file_name}</p>
            <p>Permission: {fileShareDetails.permission}</p>
            <p>Shared With: {fileShareDetails.shared_with.email}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Container>
    </>
  );
};

export default ShareLinkPage;