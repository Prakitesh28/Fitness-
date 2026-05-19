import client from './client';
export const getMe = async () => (await client.get('/users/me')).data;
export const updateMe = async (payload) => (await client.patch('/users/me', payload)).data;
export const deleteMe = async () => (await client.delete('/users/me')).data;
export const changePassword = async (payload) => (await client.post('/users/me/change-password', payload)).data;
