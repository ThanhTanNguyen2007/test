import { PhoneNumber } from '@prisma/client';
import querystring from 'query-string';
import axios, { AxiosResponse } from 'axios';
import _ from 'lodash';
import config from '../../config';
import createGraphUrl from './helpers/createGraphUrl';
import logger from '../../logger';

type GranularScope = {
  scope: string;
  target_ids: string[];
};

type DebugTokenResponse = {
  data: {
    app_id: string;
    type: string;
    application: string;
    data_access_expires_at: number;
    expires_at: number;
    is_valid: boolean;
    scopes: string[];
    granular_scopes: GranularScope[];
    user_id: string;
  };
};

type SystemUsersResponse = {
  data: {
    id: string;
    name: string;
    role: 'EMPLOYEE' | 'ADMIN';
  }[];
};

type WabaSystemUserResponse = {
  data: {
    id: string;
    name: string;
    tasks: ('MANAGE' | 'DEVELOP')[];
  }[];
};

type PhoneCertResponse = {
  data: {
    id: string;
    display_phone_number: string;
    certificate: string;
  }[];
};

type MessageTemplateResponse = {
  data: {
    name: string;
    components: {
      type: string;
      text: string;
    }[];
    language: string;
    status: string;
    category: string;
    id: string;
  }[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
};

type MessageNamespaceResponse = {
  id: string;
  message_template_namespace: string;
};

type CreditLineResponse = {
  data: { id: string; legal_entity_name: string }[];
};

type ShareCreditLineResponse = {
  allocation_config_id: string;
  waba_id: string;
};

type CreditLineAllocationResponse = {
  receiving_credential: { id: string };
  id: string;
  receiving_business: { name: string; id: string };
  request_status: string;
};

type WabaPaymentMethodResponse = {
  id: string;
  primary_funding_id: string;
};

type BusinessIdResponse = {
  owner_business_info: {
    name: string;
    id: string;
  };
};

type CreditLineAllocationForBusinessResponse = {
  id: string;
  receiving_business: {
    name: string;
    id: string;
  };
};

type WabaResponse = {
  id: string;
  name: string;
  currency: string;
  timezone_id: string;
  account_review_status: string;
  message_template_namespace: string;
  owner_business_info: {
    name: string;
    id: string;
  };
};

type ClientWabasResponse = {
  data: {
    id: string;
    name: string;
    currency: string;
    timezone_id: string;
    account_review_status: string;
    message_template_namespace: string;
    owner_business_info: {
      name: string;
      id: string;
    };
  }[];
  paging: {
    next: string;
  };
};

type PhoneNumbersResponse = {
  data: PhoneNumberFromApi[];
};

export type PhoneNumberFromApi = {
  id: string;
  display_phone_number: string;
  code_verification_status: string;
  certificate: string;
  new_certificate: string;
  name_status: string;
  new_name_status: string;
  account_mode: string;
  quality_rating: string;
  verified_name: string;
  status: string;
};

type AnalyticResponse = {
  id: string;
  analytics: {
    data_points: {
      start: number;
      end: number;
      sent: number;
      delivered: number;
    }[];
  };
};

/**
 * Gets exact list of WhatsApp Accounts the user has shared with you
 * @param oauthToken Access token returned by Facebook embedded login
 */
export const getSharedWhatsAppAccountIds = async (oauthToken: string) => {
  try {
    const url = createGraphUrl('debug_token');
    url.searchParams.set('input_token', oauthToken);
    const res: AxiosResponse<DebugTokenResponse> = await axios.get(url.toString());
    const waScope = _.find(res?.data?.data?.granular_scopes, ({ scope }) => {
      // return scope === 'whatsapp_business_management​';
      return scope === 'whatsapp_business_management';
    });
    return waScope?.target_ids;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    return null;
  }
};

// May not need if we just manually add it to env
export const getSystemUsers = async () => {
  try {
    const url = createGraphUrl(`${config.FACEBOOK_KEYREPLY_BUSINESS_ID}/system_users`);
    const res: AxiosResponse<SystemUsersResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

// Add System User to WhatsApp Business Account so the System User is able to
// programmatically manage account data
// Note that an ADMIN system user access token is used for this call
// MANAGE : Admin Access. Users can have admin access on a WABA that is
// shared with Admin permissions
// DEVELOP : Developer access. Users can have developer access on a WABA that
// is shared with Standard permissions.
export const addSystemUserToWaba = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}/assigned_users`, true);
    url.searchParams.set('user', config.FACEBOOK_SYSTEM_USER_ID);
    url.searchParams.set('tasks', "['MANAGE', 'DEVELOP']");
    await axios.post(url.toString());
    return;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

// For verifying that system user was added
export const getWabaSystemUsers = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}/assigned_users`);
    url.searchParams.set('business', config.FACEBOOK_KEYREPLY_BUSINESS_ID);
    const res: AxiosResponse<WabaSystemUserResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

// Called on demand when user or partner wants to get certificate
export const getPhoneNumberCert = async (wabaId: string, phoneNumber: string) => {
  try {
    const url = createGraphUrl(`${wabaId}/phone_numbers`);
    url.searchParams.set('fields', 'display_phone_number,certificate');
    const res: AxiosResponse<PhoneCertResponse> = await axios.get(url.toString());
    const certificate = _.find(res.data.data, (phoneDetails) => phoneDetails.display_phone_number === phoneNumber);
    return certificate;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getMessageTemplates = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}/message_templates`);
    const res: AxiosResponse<MessageTemplateResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getMessageTemplateNamespace = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}`);
    url.searchParams.set('fields', 'message_template_namespace');
    const res: AxiosResponse<MessageNamespaceResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getCreditLine = async () => {
  try {
    const url = createGraphUrl(`${config.FACEBOOK_KEYREPLY_BUSINESS_ID}/extendedcredits`);
    url.searchParams.set('fields', 'id,legal_entity_name');
    const res: AxiosResponse<CreditLineResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const shareCreditLine = async (wabaId: string, wabaCurrency: string, creditLineId: string) => {
  try {
    const url = createGraphUrl(`${creditLineId}/whatsapp_credit_sharing_and_attach`);
    url.searchParams.set('waba_id', wabaId);
    url.searchParams.set('waba_currency', wabaCurrency);
    const res: AxiosResponse<ShareCreditLineResponse> = await axios.post(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getCreditLineAllocation = async (allocationConfigId: string) => {
  try {
    const url = createGraphUrl(`${allocationConfigId}`);
    url.searchParams.set('fields', 'receiving_business,request_status,receiving_credential{id}');
    const res: AxiosResponse<CreditLineAllocationResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getCreditLineAllocationForBusiness = async (creditLineId: string, businessId: string) => {
  try {
    const url = createGraphUrl(`${creditLineId}/owning_credit_allocation_configs`);
    url.searchParams.set('fields', 'id,receiving_business');
    url.searchParams.set('receiving_business_id', businessId);
    const res: AxiosResponse<CreditLineAllocationForBusinessResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

// To verify that credit line 'receiving_credential' and 'primary_funding_id' match
// as waba will be using the attached credit line instead of their own payment method
export const getWabaPaymentMethod = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}`);
    url.searchParams.set('fields', 'primary_funding_id');
    const res: AxiosResponse<WabaPaymentMethodResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getBusinessIdFromWabaId = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}`);
    url.searchParams.set('fields', 'owner_business_info');
    const res: AxiosResponse<BusinessIdResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getWabaInfo = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}`);
    url.searchParams.set(
      'fields',
      'account_review_status,name,currency,timezone_id,owner_business_info,message_template_namespace',
    );
    const res: AxiosResponse<WabaResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

// According to Billing Liability Disclosure, Embedded Signup auto grans access to Line of Credit
// Revoke on initial sign up before verifying that it is a correct business
// Add back credit line after internal verification is done
export const revokeCreditLine = async (allocationConfigId: string) => {
  try {
    const url = createGraphUrl(`${allocationConfigId}`);
    const res: AxiosResponse<BusinessIdResponse> = await axios.delete(url.toString());
    return res.data;
  } catch (error) {
    const apiError = error?.response?.data?.error;
    if (!apiError) {
      logger.error(error.message);
      throw error;
    }
    const errorMessage = apiError['error_user_msg'];
    if (errorMessage && errorMessage.includes('This credit allocation has already been revoked.')) {
      logger.error(errorMessage);
      return;
    }

    throw error;
  }
};

export const subscribeToWebhookForWaba = async (wabaId: string) => {
  try {
    const url = createGraphUrl(`${wabaId}/subscribed_apps`);
    const res: AxiosResponse<BusinessIdResponse> = await axios.post(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

// Was responding with 403
// message: '(#200) Requires business_management permission to manage the object', type: 'OAuthException', code: 200, fbtrace_id: 'ABAhfbCnT4kLr_-TaborGoP'
export const getClientWabas = async () => {
  try {
    const wabas = [];
    let pagingUrl = '';
    const url = createGraphUrl(`${config.FACEBOOK_KEYREPLY_BUSINESS_ID}/client_whatsapp_business_accounts`, true);
    url.searchParams.set(
      'fields',
      'account_review_status,name,currency,timezone_id,owner_business_info,message_template_namespace',
    );
    pagingUrl = url.toString();

    while (pagingUrl && pagingUrl !== '') {
      const { data, next } = await getClientWabasPagination(pagingUrl);
      wabas.push(...data);
      pagingUrl = next;
    }

    return {
      data: wabas,
    };
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

const getClientWabasPagination = async (next: string) => {
  const res: AxiosResponse<ClientWabasResponse> = await axios.get(next);
  const { data, paging } = res.data;
  return {
    data,
    next: paging?.next,
  };
};

export const getPhoneNumbers = async (wabaId: string): Promise<PhoneNumberFromApi[]> => {
  try {
    const url = createGraphUrl(`${wabaId}/phone_numbers`);
    url.searchParams.set(
      'fields',
      'display_phone_number,certificate,name_status,new_certificate,new_name_status,verified_name,quality_rating,status,code_verification_status',
    );
    const res: AxiosResponse<PhoneNumbersResponse> = await axios.get(url.toString());
    return res.data?.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const getPhoneNumber = async (phoneNumberId: string): Promise<PhoneNumberFromApi> => {
  try {
    const url = createGraphUrl(`${phoneNumberId}`);
    url.searchParams.set(
      'fields',
      'display_phone_number,certificate,name_status,new_certificate,new_name_status,verified_name,quality_rating,status,code_verification_status',
    );
    const res: AxiosResponse<PhoneNumberFromApi> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    throw error;
  }
};

export const initiatePhoneMigration = async (
  countryCode: number,
  phoneNumber: number,
  wabaId: string,
): Promise<string | null> => {
  try {
    const url = createGraphUrl(`${wabaId}/phone_numbers`);
    const body = querystring.stringify({
      cc: countryCode,
      phone_number: phoneNumber,
      migrate_phone_number: true,
    });
    const res = await axios.post(url.toString(), body);
    return res.data.id;
  } catch (error) {
    if (error.response?.data?.error) {
      const errorFromFb = error.response?.data?.error;
      logger.error(errorFromFb);
      const errorTitle = errorFromFb?.error_user_title;
      if (errorTitle && errorTitle.includes('Duplicate phone number')) {
        // Already init migration, get phone number id instead
        const phoneNumbers = await getPhoneNumbers(wabaId);
        const migratingPhoneNumber = phoneNumbers.find((phone) => {
          return phone.display_phone_number.replace(/\D/g, '').endsWith('' + phoneNumber);
        });
        return migratingPhoneNumber?.id || null;
      }
    } else {
      logger.error(error.message);
    }
    return null;
  }
};

export const requestOTP = async (codeMethod: string, phoneNumberId: string): Promise<boolean> => {
  try {
    const url = createGraphUrl(`${phoneNumberId}/request_code`);
    const body = querystring.stringify({
      code_method: codeMethod,
      language: 'en_US',
    });
    const res = await axios.post(url.toString(), body);
    return res.data.success;
  } catch (error) {
    const message = error.response?.data?.error.error_user_msg || error.message;
    logger.error(message);
    throw new Error(message);
  }
};

export const verifyCode = async (code: string, phoneNumberId: string): Promise<boolean> => {
  try {
    const url = createGraphUrl(`${phoneNumberId}/verify_code`);
    const body = querystring.stringify({
      code: code,
    });
    const res = await axios.post(url.toString(), body);
    return res.data.success;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    return false;
  }
};

export const getWabaAnalytics = async (wabaId: string, phoneNumber: string | null, start: number, end: number) => {
  try {
    // ${
    //   phoneNumber && [phoneNumber.shortenValue]
    // }
    const url = createGraphUrl(`${wabaId}`);
    url.searchParams.set(
      'fields',
      `analytics.start(${start}).end(${end}).granularity(DAY).phone_numbers([${phoneNumber}]).country_codes([])`,
    );
    const res: AxiosResponse<AnalyticResponse> = await axios.get(url.toString());
    return res.data;
  } catch (error) {
    logger.error(error.response?.data?.error || error.message);
    return null;
  }
};
