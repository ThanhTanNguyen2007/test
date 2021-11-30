import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { ApiKey, Partner } from '../types';

const createPartner = async (userId: number, timezone: string) => {
  try {
    const response: AxiosResponse<Partner> = await axios.post(`/partner`, { userId, timezone });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const changeActivation = async (partnerId: number, isActivated: boolean) => {
  try {
    const response: AxiosResponse<Partner> = await axios.patch(`/partner/${partnerId}/changeActivation`, {
      isActivated,
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const generateApiKey = async () => {
  try {
    const response: AxiosResponse<ApiKey> = await axios.post('/partner/generateApiKey');
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const deactivateApiKey = async () => {
  try {
    const response: AxiosResponse<ApiKey> = await axios.put('/partner/deactivateApiKey');
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const getApiKey = async () => {
  try {
    const response: AxiosResponse<ApiKey> = await axios.get('/partner/getApiKey');
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const getPartnerApiUsage = async () => {
  try {
    const response = await axios.get(`/partner/getPartnerApiUsage`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { createPartner, changeActivation, getApiKey, generateApiKey, deactivateApiKey, getPartnerApiUsage };
