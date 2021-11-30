import { axios } from './axios';

type LoginResponse = {
  email: string;
  requiresEmailVerification?: boolean;
};

const login = async (code: string, state: string) => {
  try {
    const res = await axios.post('/login', { code, state });
    return <LoginResponse>res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const logout = async () => {
  try {
    await axios.post('/logout');
  } catch (error) {
    console.log(error);
  }
};

export { login, logout };
