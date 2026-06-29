import api from './api';

export const getWarehouses = async () => {
  const res = await api.get('/warehouses');
  return res.data;
};

export const getWarehouseStock = async (id) => {
  const res = await api.get(`/warehouses/${id}/stock`);
  return res.data;
};

export const createWarehouse = async (data) => {
  const res = await api.post('/warehouses', data);
  return res.data;
};

export const updateWarehouse = async (id, data) => {
  const res = await api.put(`/warehouses/${id}`, data);
  return res.data;
};

export const deleteWarehouse = async (id) => {
  await api.delete(`/warehouses/${id}`);
};
