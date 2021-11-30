import { AuditAction } from '@prisma/client';
import { audit } from '..';
import * as api from './api';
import logger from '../../logger';

const revokeCreditLineWithWabaId = async (wabaId: string) => {
  try {
    // Fetch the credit line ID from your business
  const { data } = await api.getCreditLine();
  // TODO: May need to filter by legal entity name
  const creditLineId = data[0].id;
  // Fetch the client’s business ID
  const {
    owner_business_info: { id: businessId },
  } = await api.getBusinessIdFromWabaId(wabaId);
  // Fetch the credit sharing record from your credit line to the end client’s business
  const { id: creditLineAllocationId } = await api.getCreditLineAllocationForBusiness(creditLineId, businessId);
  // Revoke the credit sharing
  if(!creditLineAllocationId) {
    logger.info(`Business account does not have any credit line`)
  } else {
    await api.revokeCreditLine(creditLineAllocationId)
    await audit.insertAudit(AuditAction.CREDIT_LINE_REVOKED, {
      wabaId,
      creditLineAllocationId
    })
  }
  } catch (error) {
    logger.error(error.message)
    return; 
  }
};

export default revokeCreditLineWithWabaId;
