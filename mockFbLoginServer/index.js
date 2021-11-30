const express = require('express');
const app = express();
const port = 4010;

// Just some magic numbers
const wabaId = 1;
const krBusinessId = 99;
const allocationConfigId = 55;
const creditLineId = 555;
const receivingCredential = 999;

app.get('/', (req, res) => {
  res.send('Facebook Mock Server');
});

const v8Router = () => {
  const router = new express.Router();
  router.get('/debug_token', (req, res) => {
    res.send({
      data: {
        app_id: '<APP_ID>',
        type: 'USER',
        application: '<APP_NAME>',
        data_access_expires_at: 1600000000,
        expires_at: 1600000000,
        is_valid: true,
        scopes: ['whatsapp_business_management', 'public_profile'],
        granular_scopes: [
          {
            scope: 'whatsapp_business_management',
            target_ids: ['1'],
          },
        ],
        user_id: 'XXXXXXXXXXXXXXX',
      },
    });
  });
  router.get('/system_users', (req, res) => {
    res.send({
      data: [
        {
          id: '1972555232742222',
          name: 'My System User',
          role: 'EMPLOYEE',
        },
      ],
    });
  });
  router.post(`/${wabaId}/assigned_users`, (req, res) => {
    res.send({
      success: true,
    });
  });
  router.get(`/${wabaId}/assigned_users`, (req, res) => {
    res.send({
      data: [
        {
          id: '1972385232742142',
          name: 'Anna Flex',
          tasks: ['MANAGE'],
        },
        {
          id: '1972385232752545',
          name: 'Jasper Brown',
          tasks: ['DEVELOP'],
        },
      ],
    });
  });
  router.get(`/${wabaId}/phone_numbers`, (req, res) => {
    res.send({
      data: [
        {
          id: '1972385232742141',
          display_phone_number: '+1 631-555-1111',
          certificate: 'AbCdEfGhIjKlMnOpQrStUvWxYz',
          new_certificate: '123AbCdEfGhIjKlMnOpQrStUvWxYz',
          name_status: 'APPROVED',
          new_name_status: 'APPROVED',
          account_mode: 'SANDBOX',
        },
      ],
    });
  });
  router.get(`/${wabaId}/message_templates`, (req, res) => {
    res.send({
      data: [
        {
          name: 'hello_world',
          components: [
            {
              type: 'BODY',
              text: 'Hello, {{1}}',
            },
          ],
          language: 'en_US',
          status: 'APPROVED',
          category: 'ISSUE_RESOLUTION',
          id: '409119052980796',
        },
        {
          name: 'case_opened',
          components: [
            {
              type: 'BODY',
              text:
                'Seu caso {{1}} foi aberto. Entraremos em contato em breve.',
            },
          ],
          language: 'pt_BR',
          status: 'APPROVED',
          category: 'TICKET_UPDATE',
          id: '718173718589371',
        },
        {
          name: 'case_opened',
          components: [
            {
              type: 'BODY',
              text: 'Your case {{1}} was opened. We will get in touch soon.',
            },
          ],
          language: 'en_US',
          status: 'APPROVED',
          category: 'TICKET_UPDATE',
          id: '755551981307120',
        },
      ],
      paging: {
        cursors: {
          before: 'MAZDZD',
          after: 'MjQZD',
        },
      },
    });
  });
  router.get(`/${wabaId}`, (req, res) => {
    res.send({
      id: '1972385232742141',
      message_template_namespace: '12abcdefghijk_34lmnop',
      owner_business_info: {
        name: 'Client Business Name',
        id: `${krBusinessId}`,
      },
      primary_funding_id: `${receivingCredential}`,
    });
  });
  router.get(`/${krBusinessId}/extendedcredits`, (req, res) => {
    res.send({
      data: [
        {
          id: `${creditLineId}`,
          legal_entity_name: 'Your Legal Entity',
        },
      ],
    });
  });
  router.post(
    `/${creditLineId}/whatsapp_credit_sharing_and_attach`,
    (req, res) => {
      res.send({
        allocation_config_id: `${allocationConfigId}`,
        waba_id: `${wabaId}`,
      });
    }
  );
  router.get(`/${allocationConfigId}`, (req, res) => {
    res.send({
      receiving_credential: {
        id: `${receivingCredential}`,
      },
      id: '1972385232742147',
    });
  });
  router.get(
    `/${creditLineId}/owning_credit_allocation_configs`,
    (req, res) => {
      res.send({
        id: `${allocationConfigId}`, //allocation config (i.e. credit sharing id)
        receiving_business: {
          name: 'Client Business Name',
          id: '1972385232742147',
        },
      });
    }
  );
  router.delete(`/${allocationConfigId}`, (req, res) => {
    res.send({
      success: true,
    });
  });
  router.post(`/${wabaId}/subscribed_apps`, (req, res) => {
    res.send({
      success: true,
    });
  });
  router.get(
    `/${krBusinessId}/client_whatsapp_business_accounts`,
    (req, res) => {
      res.send({
        data: [
          {
            id: '1',
            name: 'My WhatsApp Business Account',
            currency: 'USD',
            timezone_id: '1',
            message_template_namespace: 'abcdefghijk_12lmnop',
          },
          {
            id: 1972385232742141,
            name: 'My Regional Account',
            currency: 'INR',
            timezone_id: '5',
            message_template_namespace: '12abcdefghijk_34lmnop',
          },
        ],
        paging: {
          cursors: {
            before: 'abcdefghij',
            after: 'klmnopqr',
          },
        },
      });
    }
  );
  return router;
};

app.use('/v8.0', v8Router());

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
