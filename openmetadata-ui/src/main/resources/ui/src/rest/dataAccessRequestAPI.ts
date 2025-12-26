import APIClient from './index';

const BASE_URL = '/dataAccessRequests';

export const createDataAccessRequest = async (data: any) => {
  const response = await APIClient.post<any>(`${BASE_URL}`, data);
  return response.data;
};

export const listDataAccessRequests = async (params?: Record<string, any>) => {
  const response = await APIClient.get<{ data: any[]; paging?: any }>(`${BASE_URL}`, {
    params,
  });
  return response.data;
};

export const getDataAccessRequestById = async (id: string) => {
  const response = await APIClient.get<any>(`${BASE_URL}/${id}`);
  return response.data;
};

export default {
  createDataAccessRequest,
  listDataAccessRequests,
  getDataAccessRequestById,
};