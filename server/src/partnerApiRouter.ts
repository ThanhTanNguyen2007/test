import { Router } from 'express';
import apiKeyMiddleware from './middleware/apiKeyMiddleware';
import { account, partner, partnerToken, phoneNumber, user } from './controllers';

const partnerApiRouter = (): Router => {
  const router = Router();
  router.get('/phone-number', apiKeyMiddleware, phoneNumber.getAllPhoneNumbersOfWaba);
  router.get('/phone-number/:phoneNumberId/cert', apiKeyMiddleware, phoneNumber.getPhoneCert);
  router.get('/phone-number/:phoneNumberId/status', apiKeyMiddleware, phoneNumber.getPhoneStatus);
  router.get('/phone-number/:phoneNumberId/nameStatus', apiKeyMiddleware, phoneNumber.getPhoneNameStatus);
  router.get('/phone-number/:phoneNumberId/qualityRating', apiKeyMiddleware, phoneNumber.getQualityRating);
  
  router.get('/partner-key', apiKeyMiddleware, partnerToken.find);
  router.post('/partner-key', apiKeyMiddleware, partnerToken.create);
  router.put('/partner-key/:partnerKeyId/revoke', apiKeyMiddleware, partnerToken.revoke);
  
  router.get('/account', apiKeyMiddleware, account.findForPartnerApi);
  router.get('/account/:wabaId/templateToken', apiKeyMiddleware, account.getTemplateToken);
  router.get('/account/:wabaId/status', apiKeyMiddleware, account.getWABAStatus);
  router.put('/account/:wabaId/enable-credit-line', apiKeyMiddleware, account.enableCreditLine);
  router.put('/account/:wabaId/disable-credit-line', apiKeyMiddleware, account.disableCreditLine);
  router.get('/partner/embeddedUrl', apiKeyMiddleware, partner.getEmbeddedUrl);
  router.get('/user/customerId', apiKeyMiddleware, user.getCustomerId);
  return router;
};

export default partnerApiRouter;
