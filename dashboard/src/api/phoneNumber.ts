import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { PhoneNumber } from '../types';

type PhoneCert = {
  id: number;
  cert: string;
  value: string;
};

type FindResponse = {
  phoneNumbers: PhoneNumber[];
  total: number;
  selectedPage: number;
  selectedSize: number;
};

/**
 * Uses cookies to check if session still valid and user's self info
 * Useful for when user closes and opens the page
 */
const find = async (isGettingAll = false, page = 1, size = 10, searchText = '') => {
  try {
    let query = `isGettingAll=${isGettingAll}`;
    query += `&page=${page}`;
    query += `&size=${size}`;
    query += `&search=${searchText}`;

    const res: AxiosResponse<FindResponse> = await axios.get(`/phone-number?${query}`);
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getPhoneCert = async (phoneNumberId: string) => {
  try {
    const phoneCert: AxiosResponse<PhoneCert> = await axios.get(`/phone-number/${phoneNumberId}/cert`);
    return phoneCert.data;
  } catch (error) {
    console.log(error);
  }
};

export { find, getPhoneCert };
