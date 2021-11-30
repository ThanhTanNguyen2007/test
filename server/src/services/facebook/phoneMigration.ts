import * as api from './api';

const initiatePhoneMigration = async (countryCode: number, phoneNumber: number, wabaId: string) => {
    return await api.initiatePhoneMigration(countryCode, phoneNumber, wabaId)
}

const requestOTP = async (codeMethod: string, phoneNumberId: string): Promise<boolean> => {
    return await api.requestOTP(codeMethod, phoneNumberId);
}

const verifyCode = async (code: string, phoneNumberId: string): Promise<boolean> => {
    return await api.verifyCode(code, phoneNumberId);
}

export {initiatePhoneMigration, requestOTP, verifyCode}