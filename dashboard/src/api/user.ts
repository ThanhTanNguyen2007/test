import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { User } from '../types';

/**
 * Uses cookies to check if session still valid and user's self info
 * Useful for when user closes and opens the page
 */
export const me = async () => {
  try {
    const response = await axios.get('/me');
    return response.data;
  } catch (error) {
    console.log(error.message);
  }
};

type FindResponse = {
  users: User[];
  total: number;
  selectedPage: number;
  selectedSize: number;
};

export const find = async (searchText = '', page = 1, size = 10) => {
  try {
    const response: AxiosResponse<FindResponse> = await axios.get(
      `/user?page=${page}&size=${size}${searchText && '&search=' + searchText}`,
    );
    return response.data;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

export const initiateOnboardingProcess = async () => {
  try {
    await axios.get('/user/initiate');
  } catch (error) {
    console.log(error.message);
  }
};

export const getCustomerId = async (customerEmail: string) => {
  try {
    const response = await axios.get(`/user/customerId?email=${customerEmail}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
