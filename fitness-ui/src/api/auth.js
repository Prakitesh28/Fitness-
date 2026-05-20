import client from './client';

export const login = async ({ email, password }) => {
  const body = new URLSearchParams();
  body.append('username', email);
  body.append('password', password);

  const { data } = await client.post('/auth/login', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
};

export const register = async (payload) => (await client.post('/auth/register', payload)).data;
export const logoutApi = async () => (await client.post('/auth/logout')).data;
