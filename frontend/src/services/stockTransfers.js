import api from './api';

export const getStockTransfers = async () => {
  const res = await api.get('/stock-transfers');
  return res.data;
};

export const createStockTransfer = async (data) => {
  const res = await api.post('/stock-transfers', data);
  return res.data;
};

export const updateStockTransfer = async (id, data) => {
  const res = await api.put(`/stock-transfers/${id}`, data);
  return res.data;
};
