import client from './client';
export const getNutritionLogs = async (params = {}) => (await client.get('/nutrition', { params })).data;
export const createNutritionLog = async (payload) => (await client.post('/nutrition', payload)).data;
