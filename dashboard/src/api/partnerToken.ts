import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { PartnerToken } from '../types';

const find = async (partnerId: number) => {
  try {
    const response: AxiosResponse<PartnerToken[]> = await axios.get(`/partner/${partnerId}/partner-key`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const create = async (partnerId: number) => {
  try {
    const response: AxiosResponse<PartnerToken> = await axios.post(`/partner/${partnerId}/partner-key`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const revoke = async (partnerKeyId: number, partnerId: number) => {
  try {
    const response: AxiosResponse<PartnerToken> = await axios.put(`/partner/${partnerId}/partner-key/${partnerKeyId}/revoke`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export { create, find, revoke };
