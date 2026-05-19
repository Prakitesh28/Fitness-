import client from './client';
export const getBodyweightTrend = async (days = 30) => (await client.get('/stats/bodyweight', { params: { days } })).data;
export const getStreak = async () => (await client.get('/stats/streak')).data;
export const getWeeklyVolume = async (week) => (await client.get('/stats/volume', { params: { week } })).data;
