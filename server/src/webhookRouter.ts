import { Router } from 'express';
import { webhook } from './controllers';

const webhookRouter = (): Router => {
  const router = Router();
  router.get('/', webhook.validateVerificationRequests);
  router.post('/', webhook.handleWebhookEvents);
  return router;
};

export default webhookRouter;
