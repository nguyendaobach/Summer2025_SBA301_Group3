import axios from 'axios';

const axiosInstance = axios.create({
    // baseURL: 'http://localhost:8080/api/v1',
    baseURL: 'http://localhost:8080/api/v1',
    headers: {

        'Content-Type': 'application/json',
        'Accept': 'application/json',

    },
    withCredentials: true
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor if needed
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle unauthorized errors (401)
        if (error.response && error.response.status === 401) {
            // Clear local storage if token is invalid or expired
            localStorage.clear(); // Sử dụng clear thay vì xóa từng item để đồng bộ với Header.jsx

            // Redirect to login page if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 