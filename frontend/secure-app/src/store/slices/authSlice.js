import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import api from '../../utils/axiosConfig';

const API_URL = `https://${process.env.REACT_APP_APP_HOST}:${process.env.REACT_APP_APP_PORT}/user`;

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/register`, {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.username[0] || error.response?.data?.password[0] || error.response?.data?.email[0] || 'Registration Failed';
      console.error('Registration error:', msg);
      return rejectWithValue({'error': msg});
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/login`, {  // Note the URL change if needed
        username: credentials.username,
        password: credentials.password,
      });
      if (response.data.mfaRequired) {
        return {
          mfaRequired: true,
          username: response.data.username
        };
      }
      
      const { user,refresh,access } = response.data;
      
      // Store tokens in HttpOnly cookies
      Cookies.set('accessToken', access, { 
        secure: true, 
        sameSite: 'strict',
        expires: 60/1440 // 60 mins
      });
      Cookies.set('refreshToken', refresh, {
        secure: true,
        sameSite: 'strict',
        expires: 1 // 1 day
      });
      
      return { 
        user: user, 
        access, 
        refresh,
        mfaRequired: false 
      };
    } catch (error) {
      console.error('Login error:', error.response?.data);
      const msg = error.response?.data?.error || 'Invalid username or password';
      return rejectWithValue({'error': msg});
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      await api.post(`${API_URL}/logout`, { refresh: refreshToken });
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const setupMFA = createAsyncThunk(
  'auth/setupMFA',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/mfa/setup`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async ({ code }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/mfa/verify`, { code });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const verifyLoginMFA = createAsyncThunk(
  'auth/verifyLoginMFA',
  async ({ code, username }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/mfa/verify-login`, { 
        code,
        username  // Pass username to backend
      });
      const { user, access, refresh } = response.data;
      
      Cookies.set('accessToken', access, { 
        secure: true, 
        sameSite: 'strict',
        expires: 60/1440
      });
      Cookies.set('refreshToken', refresh, {
        secure: true,
        sameSite: 'strict',
        expires: 1
      });
      
      return { user: user, access, refresh };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
    mfaRequired: false,
    mfaSecret: null,
    mfaQrCode: null,
    username: null,
    userRole: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.user = null;
      state.isAuthenticated = false;
      state.mfaRequired = false;
      state.username = null;
    },
    setUser: (state, action) => {
      // Decode the token or fetch user data based on the token
      var userData;
      try{
        userData=jwtDecode(action.payload);
      } catch (error){
        console.error('Failed to decode token:', error);
        userData=null;
      }
      if(userData){
        state.user = userData;
        state.isAuthenticated = true;
        state.userRole=userData.role;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload; // Set loading state
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.payload?.message;
      })
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        if (action.payload.mfaRequired) {
          state.mfaRequired = true;
          state.username = action.payload.username;  // Store username
        } else {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.userRole = action.payload.user.role;
          state.mfaRequired = false;
          state.username = null;  // Clear username after successful login
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'failed';
      })
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(setupMFA.fulfilled, (state, action) => {
        state.mfaSecret = action.payload.secret;
        state.mfaQrCode = action.payload.qrCode;
      })
      .addCase(verifyMFA.fulfilled, (state) => {
        state.user.mfaEnabled = true;
        state.mfaSecret = null;
        state.mfaQrCode = null;
      })
      .addCase(verifyLoginMFA.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userRole = action.payload.user.role;
        state.mfaRequired = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyLoginMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      });
  },
});

export const { clearError, setUser, setLoading } = authSlice.actions;

export default authSlice.reducer; 