import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getMediaUrl = (photoPath) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http')) return photoPath;
    
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    
    return `${baseUrl}${path}`;
};

export default api;
