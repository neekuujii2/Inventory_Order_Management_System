import api from './api';

export const getStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};
