import { AuditAction } from '@prisma/client';
import * as audit from '../audit';
import * as api from './api';

const revokeCreditLineWithAllocationId = async (creditLineAllocationId: string) => {
  await api.revokeCreditLine(creditLineAllocationId);
  await audit.insertAudit(AuditAction.CREDIT_LINE_REVOKED, {
    creditLineAllocationId
  })
};

export default revokeCreditLineWithAllocationId;
