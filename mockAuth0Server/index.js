const express = require('express');
const app = express();
const port = 4005;

app.get('/', (req, res) => {
  res.send('Auth0 Mock Server');
});

app.post('/oauth/token', (req, res) => {
  res.send({
    access_token: 'IRwPciZF6Ptosq6zVClEHLokDxP0UJ_Y',
    id_token:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InA5ZTA4MF9RSlJCTW5HQ3dJQllYZCJ9.eyJnaXZlbl9uYW1lIjoiTmciLCJmYW1pbHlfbmFtZSI6Ikplcm9tZSIsIm5pY2tuYW1lIjoiamVyb21lbmc4ODgiLCJuYW1lIjoiTmcgSmVyb21lIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdpUmdEZWRTT2FPdm5nLXhQdlFSbnVUNER1MjFkc1pVMzduYkVTRD1zOTYtYyIsImxvY2FsZSI6ImVuLUdCIiwidXBkYXRlZF9hdCI6IjIwMjEtMDEtMjdUMDg6MDk6MTUuMjE0WiIsImVtYWlsIjoiamVyb21lbmc4ODhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vd2hhdHNhcHAta3ItamVyb21lLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMDIwNjAwNzI5NTQ5ODE4MTAyOCIsImF1ZCI6IjAxcFZON2Eyb3RSUzk5dUp3c0c1eHNUQ0I5eDVJQkMxIiwiaWF0IjoxNjExNzM0OTU2LCJleHAiOjE2MTE3MzQ5NjYsImF1dGhfdGltZSI6MTYxMTczNDk1NX0.Lz-0bT8jzGLp9DmEGuAv1AywiYsVKYHmZaxP9jTyLorwmEyc6b-UfcqP_S7i3i8wBRTXFlqUv3n6N4ViMkpoV6dOqquVK8RWHFeytjoi6KYrDr1jCehzGdgcWgsQOPQqmC2qkK_pPppivVOhHlfZRo9M31Jtbpe58WcSQ0Us8NyBDsFnVq7fD2xJg-htH7T41EoVuvjHF1PyB08MjjTjQb41cPpS0WeFov9dvzCo4qBjIv6GYADqvI58uy4obn__blcq0Qy6_OF1IdNB47-sYp0Ba9xqKM8038jkA8N4O1n1oFpBriLr1K2Cq-ZMU_t9D2I9oySmFpmj1Oby6y5yRQ',
    scope: 'openid profile email',
    expires_in: 86400,
    token_type: 'Bearer',
    mock_server: true,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
