import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { Account, PhoneNumber } from '../types';

export type WabaPhoneNumber = {
  account: Account;
  newPhoneNumbers: PhoneNumber[];
  tasks: ('MANAGE' | 'DEVELOP')[];
};

type FindResponse = {
  accounts: Account[];
  total: number;
  selectedPage: number;
  selectedSize: number;
};

/**
 * Uses cookies to check if session still valid and user's self info
 * Useful for when user closes and opens the page
 */
const connect = async (
  oauthToken: string,
  partnerToken: undefined | string,
  customerId: undefined | string = undefined,
) => {
  try {
    const path = customerId ? '/account/connectWithCustomerId' : '/account/connect';
    const res: AxiosResponse<WabaPhoneNumber[]> = await axios.post(path, {
      oauthToken,
      partnerToken,
      ...(customerId && { customerId }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const find = async (isGettingAll = false, page = 1, size = 10, searchText = '') => {
  try {
    const res: AxiosResponse<FindResponse> = await axios.get(
      `/account?is_getting_all=${isGettingAll ? 1 : 0}&page=${page}&size=${size}${
        searchText && '&search=' + searchText
      }`,
    );
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const reload = async (wabaId: string) => {
  try {
    const res: AxiosResponse<FindResponse> = await axios.put(`/account/${wabaId}/reload`);
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getExportData = async () => {
  try {
    const res = await axios.get(`/account/export`);
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const remove = async (accountId: number) => {
  try {
    const res: AxiosResponse<string> = await axios.delete(`/account/${accountId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const userCanceledFacebookFlow = async () => {
  try {
    await axios.post(`/account/userCanceledFacebookFlow`);
  } catch (error) {
    console.log(error);
  }
};

const userWithCustomerIdCanceledFacebookFlow = async (partnerToken: string, customerId: string) => {
  try {
    await axios.post(`/account/userWithCustomerIdCanceledFacebookFlow`, {
      partnerToken,
      customerId,
    });
  } catch (error) {
    console.log(error);
  }
};
export {
  connect,
  find,
  reload,
  getExportData,
  remove,
  userCanceledFacebookFlow,
  userWithCustomerIdCanceledFacebookFlow,
};
