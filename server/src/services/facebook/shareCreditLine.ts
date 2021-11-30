import { AuditAction } from '@prisma/client';
import * as audit from '../audit';
import * as api from './api';
import logger from '../../logger';

// TODO: check if waba currency is always USD
const shareCreditLine = async (wabaId: string) => {
  try {
    // Fetch the credit line ID from your business
    const { data } = await api.getCreditLine();
    // TODO: may need to find the id from legal business name if more than 1
    const creditLineId = data[0].id;
    // Share the credit line to the client’s business
    logger.info(`Sharing credit line with WABA`)
    const { allocation_config_id: creditLineAllocationConfigId } = await api.shareCreditLine(wabaId, 'USD', creditLineId);
    // Fetch the credit sharing record from your credit line to the end client’s business
    const {
      receiving_credential: { id: receivingCredential },
    } = await api.getCreditLineAllocation(creditLineAllocationConfigId);
    const { primary_funding_id: wabaFundingId } = await api.getWabaPaymentMethod(wabaId);
    // Verify that the credit line was shared and attached correctly
    if (receivingCredential !== wabaFundingId) {
      throw new Error('Credit Line allocation was not successful!');
    }
    await audit.insertAudit(AuditAction.CREDIT_LINE_SHARED, {
      wabaId,
      creditLineAllocationConfigId
    });
    return creditLineAllocationConfigId;
  } catch (error) {
    logger.info(error.message)
    return null;
  }
};

export default shareCreditLine;
