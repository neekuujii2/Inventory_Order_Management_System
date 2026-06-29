import api from './api';

export const loginUser = (payload) => api.post('/auth/login', payload).then((response) => response.data);
export const registerUser = (payload) => api.post('/auth/register', payload).then((response) => response.data);
export const verifyEmail = (payload) => api.post('/auth/verify-email', payload).then((response) => response.data);
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then((response) => response.data);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((response) => response.data);
