import { AxiosResponse } from "axios";
import { axios } from './axios';
import { Audit } from "../types";

type AuditResponse = Audit[];
const find = async (queryPath = "") => {
    try {
      const res: AxiosResponse<AuditResponse> = await axios.get(`/audits${queryPath}`);
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  export { find };