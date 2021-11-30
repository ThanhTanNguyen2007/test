import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { Usage } from '../types';

type UsageResponse = {
  analytics: Usage[];
  total: number;
  selectedPage: number;
  selectedSize: number;
};

const getUsage = async (queryPath = '', page = 1, size = 10) => {
  try {
    const res: AxiosResponse<UsageResponse> = await axios.get(`/usage?page=${page}&size=${size}${queryPath}`);
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export { getUsage };
