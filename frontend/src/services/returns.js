import api from './api';

export const getReturns = async () => {
  const res = await api.get('/returns');
  return res.data;
};

export const createReturn = async (data) => {
  const res = await api.post('/returns', data);
  return res.data;
};

export const updateReturn = async (id, data) => {
  const res = await api.put(`/returns/${id}`, data);
  return res.data;
};
