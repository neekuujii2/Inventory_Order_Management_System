import api from './api';

export const getOrders = async (params = { limit: 100 }) => {
  const response = await api.get('/orders/', { params });
  return response.data;
};

export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (data) => {
  const response = await api.post('/orders/', data);
  return response.data;
};

export const deleteOrder = async (id) => {
  await api.delete(`/orders/${id}`);
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};
