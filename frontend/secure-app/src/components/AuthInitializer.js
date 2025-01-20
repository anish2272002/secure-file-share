import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setLoading } from '../store/slices/authSlice'; // Import your action
import Cookies from 'js-cookie';

const AuthInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const accessToken = Cookies.get('refreshToken');

    if (accessToken) {
      dispatch(setUser(accessToken)); // Dispatch the action to set the user
    }

    dispatch(setLoading(false)); 
  }, [dispatch]);

  return null; // This component does not render anything
};

export default AuthInitializer;