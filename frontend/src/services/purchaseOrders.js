import api from './api';

export const getPurchaseOrders = async () => {
  const res = await api.get('/purchase-orders');
  return res.data;
};

export const getPurchaseOrder = async (id) => {
  const res = await api.get(`/purchase-orders/${id}`);
  return res.data;
};

export const createPurchaseOrder = async (data) => {
  const res = await api.post('/purchase-orders', data);
  return res.data;
};

export const updatePurchaseOrder = async (id, data) => {
  const res = await api.put(`/purchase-orders/${id}`, data);
  return res.data;
};
