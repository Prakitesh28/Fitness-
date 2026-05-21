import client from './client';

export const getTodayChecklist = async () => (await client.get('/looks/checklist/today')).data;
export const updateTodayChecklist = async (items) =>
  (await client.patch('/looks/checklist/today', { items: JSON.stringify(items) })).data;

export const getLooksStats = async () => (await client.get('/looks/stats')).data;

export const getSkinLogs = async (days = 30) => (await client.get('/looks/skin', { params: { days } })).data;
export const createSkinLog = async (payload) => (await client.post('/looks/skin', payload)).data;

export const getHairLogs = async (days = 30) => (await client.get('/looks/hair', { params: { days } })).data;
export const createHairLog = async (payload) => (await client.post('/looks/hair', payload)).data;

export const getJawlineLogs = async (days = 30) => (await client.get('/looks/jawline', { params: { days } })).data;
export const createJawlineLog = async (payload) => (await client.post('/looks/jawline', payload)).data;

export const getLooksGoals = async () => (await client.get('/looks/goals')).data;
export const createLooksGoal = async (payload) => (await client.post('/looks/goals', payload)).data;
export const updateLooksGoal = async (id, payload) => (await client.patch(`/looks/goals/${id}`, payload)).data;
