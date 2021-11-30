import { Router } from 'express';
import requiresAdmin from './middleware/requiresAdmin';
import {
  auth,
  audit,
  user,
  health,
  account,
  partner,
  phoneNumber,
  partnerToken,
  manager,
  analytics,
  migration,
} from './controllers';
import requiresPartner from './middleware/requiresPartner';

const apiRouter = (): Router => {
  const router = Router();

  router.get('/health', health.check);

  router.post('/login', auth.login);
  router.post('/logout', auth.logout);

  router.get('/me', user.me);
  router.get('/user', requiresPartner, user.find);
  router.get('/user/customerId', requiresPartner, user.getCustomerId);
  router.get('/user/initiate', user.initiateOnboardingProcess);
  router.get('/user/:userId', user.get);
  router.put('/user/:userId', user.update);

  router.get('/partner', requiresAdmin, partner.find);
  router.get('/partner/getPartnerApiUsage', requiresAdmin, partner.getPartnerApiUsage);
  router.post('/partner', requiresAdmin, partner.create);
  router.get('/partner/getApiKey', requiresPartner, partner.getApiKey);
  router.put('/partner/deactivateApiKey', requiresPartner, partner.deactivateApiKey);
  router.post('/partner/generateApiKey', requiresPartner, partner.generateApiKey);
  router.get('/partner/:partnerId', partner.get);
  router.put('/partner/:partnerId', requiresAdmin, partner.update);
  router.patch('/partner/:partnerId/changeActivation', requiresAdmin, partner.changeActivation);

  router.get('/account', account.find);
  router.get('/account/export', account.getExportingAccounts);
  router.get('/account/:accountId', account.get);
  router.post('/account/userCanceledFacebookFlow', account.userCanceledFacebookFlow);
  router.post('/account/userWithCustomerIdCanceledFacebookFlow', account.userWithCustomerIdCanceledFacebookFlow);
  router.post('/account/connectWithCustomerId', account.connectWithCustomerId);
  router.post('/account/connect', account.connect);
  router.put('/account/:wabaId/reload', requiresAdmin, account.reload);
  router.delete('/account/:accountId', requiresAdmin, account.remove);

  router.get('/account/:accountId/phone-number', phoneNumber.find);

  router.get('/phone-number', phoneNumber.find);
  router.get('/phone-number/:phoneNumberId/cert', phoneNumber.getPhoneCert);

  router.get('/partner/:partnerId/partner-key', partnerToken.find);
  router.post('/partner/:partnerId/partner-key', partnerToken.create);
  router.put('/partner/:partnerId/partner-key/:partnerKeyId/revoke', partnerToken.revoke);

  router.get('/manager', requiresAdmin, manager.find);
  router.get('/partner/:partnerId/manager', manager.partnerFind);
  router.get('/user/:userId/manager', manager.userFind);
  // router.get('/manager/:managerId', manager.get);
  // router.put('/manager/:managerId',requiresAdmin, manager.update); // need to change partner in future, done manually by admin after month of confirm
  router.put('/manager/:managerId/enable-credit-line', requiresPartner, manager.enableCreditLine); // need to change partner in future, done manually by admin after month of confirm
  router.put('/manager/:managerId/disable-credit-line', requiresPartner, manager.disableCreditLine); // need to change partner in future, done manually by admin after month of confirm

  router.get('/usage', analytics.getAnalyticOfClients);
  router.get('/audits', requiresAdmin, audit.find);

  router.get('/migration/waba', migration.getWabaIdByPhone);
  router.post('/migration/init', migration.initiatePhoneMigration);
  router.post('/migration/requestOTP', migration.requestOTP);
  router.post('/migration/verifyCode', migration.verifyCode);
  router.post('/migration/upload', requiresAdmin, migration.uploadMigrationList);
  router.get('/migration', requiresPartner, migration.find);
  return router;
};

export default apiRouter;
