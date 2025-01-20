import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: `https://${process.env.APP_HOST}:${process.env.APP_PORT}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      console.log('401 error, attempting to refresh token...');
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        const response = await axios.post(`https://${process.env.APP_HOST}:${process.env.APP_PORT}/user/token/refresh`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        Cookies.set('accessToken', access, { 
          secure: true, 
          sameSite: 'strict',
          expires: 1
        });

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh token failure (logout user)
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 