import { AxiosResponse } from 'axios';
import { axios } from './axios';
import { Manager } from '../types';

const enableCreditLine = async (managerId: number) => {
  try {
    const manager: AxiosResponse<Manager> = await axios.put(`/manager/${managerId}/enable-credit-line`);
    return manager.data;
  } catch (error) {
    console.log(error);
  }
};
const disableCreditLine = async (managerId: number) => {
  try {
    const manager: AxiosResponse<Manager> = await axios.put(`/manager/${managerId}/disable-credit-line`);
    return manager.data;
  } catch (error) {
    console.log(error);
  }
};

export { enableCreditLine, disableCreditLine };
