import client from './client';
export const getBodyMetrics = async (params = {}) => (await client.get('/metrics/body', { params })).data;
export const createBodyMetric = async (payload) => (await client.post('/metrics/body', payload)).data;
