import { AxiosResponse } from 'axios';
import { WABAMigration } from '../types';
import { axios } from './axios';

export const init = async (countryCode: string, phoneNumber: string, wabaId: string) => {
  try {
    const response: AxiosResponse<{ phoneNumberId: string; verified: boolean }> = await axios.post('/migration/init', {
      wabaId: '' + wabaId,
      countryCode,
      phoneNumber,
    });
    return response.data;
  } catch (error) {
    console.error(error.message);
    return null;
  }
};

export const requestOTP = async (phoneNumberId: string, codeMethod: string): Promise<boolean | string> => {
  try {
    const response: AxiosResponse<boolean> = await axios.post('/migration/requestOTP', {
      phoneNumberId: '' + phoneNumberId,
      codeMethod,
    });
    return response.data;
  } catch (error) {
    console.error(error.message);
    return error.response.data;
  }
};

export const verifyCode = async (code: string, phoneNumberId: string) => {
  try {
    const response: AxiosResponse<boolean> = await axios.post('/migration/verifyCode', {
      code: '' + code,
      phoneNumberId: '' + phoneNumberId,
    });
    return response.data;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

export const find = async () => {
  try {
    const response: AxiosResponse<WABAMigration[]> = await axios.get('/migration');
    return response.data;
  } catch (error) {
    console.error(error.message);
    return [];
  }
};

export const getWabaIdByPhone = async (phoneNumber: string, email: string) => {
  try {
    const response: AxiosResponse<string> = await axios.get(`/migration/waba?phone=${phoneNumber}&email=${email}`);
    return response.data;
  } catch (error) {
    console.error(error.message);
    return null;
  }
};
