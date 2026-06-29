import api from './api';

export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const getSetting = async (key) => {
  const res = await api.get(`/settings/${key}`);
  return res.data;
};

export const setSetting = async (data) => {
  const res = await api.post('/settings', data);
  return res.data;
};
