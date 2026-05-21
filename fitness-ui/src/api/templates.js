import client from './client';

export const getTemplates = async (params = {}) => (await client.get('/templates', { params })).data;
export const getTemplateById = async (id) => (await client.get(`/templates/${id}`)).data;
export const startWorkoutFromTemplate = async (templateId) => (await client.post(`/templates/${templateId}/start-workout`)).data;
export const createTemplate = async (payload) => (await client.post('/templates', payload)).data;
export const updateTemplate = async (id, payload) => (await client.patch(`/templates/${id}`, payload)).data;
export const deleteTemplate = async (id) => (await client.delete(`/templates/${id}`)).data;