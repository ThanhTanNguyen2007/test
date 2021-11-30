import prisma from '../prisma';
import * as api from './facebook/api';
import { PhoneNumberFromApi } from './facebook/api';
import logger from '../logger';
import { Account, PhoneNumber } from '@prisma/client';

export const findPhoneNumbers = async (userId?: number, isGettingAll = false, page = 1, size = 10, search = '') => {
  try {
    const where = userId
      ? {
          account: {
            OR: [
              {
                manager: {
                  partner: {
                    userId,
                  },
                },
              },
              { userId },
            ],
          },
        }
      : undefined;

    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        ...where,
        AND: {
          OR: [
            {
              verifiedName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              value: {
                contains: search.trim(),
              },
            },
            {
              account: {
                OR: [
                  {
                    wabaId: {
                      contains: search,
                    },
                  },
                  {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      ...(!isGettingAll && { skip: (page - 1) * size }),
      ...(!isGettingAll && { take: size }),
      include: { account: true },
    });

    const total = await prisma.phoneNumber.count({
      where: {
        ...where,
        AND: {
          OR: [
            {
              verifiedName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              value: {
                contains: `+${search.trim()}`,
              },
            },
            {
              account: {
                OR: [
                  {
                    wabaId: {
                      contains: search,
                    },
                  },
                  {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    return {
      phoneNumbers,
      total,
      page,
      size,
    };
  } catch (error) {
    throw error;
  }
};

export const getPhoneCert = async (wabaId: string, phoneNumber: string) => {
  try {
    const phoneCert = await api.getPhoneNumberCert(wabaId, phoneNumber);
    return phoneCert;
  } catch (err) {
    throw err;
  }
};

export const getPhoneNumberFromFB = async (phoneNumberFBId: string) => {
  try {
    const phoneNumber = await api.getPhoneNumber(phoneNumberFBId);
    if (!phoneNumber) {
      throw new Error(`No phone found for id ${phoneNumberFBId}`);
    }
    return phoneNumber;
  } catch (error) {
    logger.error(error.message);
    return null;
  }
};

export const getPhoneNumber = async (phoneNumberId: number) => {
  try {
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        phoneNumberId: phoneNumberId.toString(),
      },
      include: {
        account: {
          include: {
            user: true,
            manager: {
              include: {
                partner: true,
              },
            },
          },
        },
      },
    });
    return phoneNumber;
  } catch (err) {
    throw err;
  }
};

export const getAllPhoneNumbersOfWaba = async (userId: number | undefined, wabaId: string) => {
  const where = userId
    ? {
        wabaId,
        OR: [
          {
            manager: {
              partner: {
                userId,
              },
            },
          },
          {
            userId,
          },
        ],
      }
    : { wabaId };
  const account = await prisma.account.findFirst({
    where,
    include: {
      phoneNumber: true,
    },
  });
  if (!account) return [];
  return account.phoneNumber;
};
export const updateOrCreateAPhoneNumber = async (phoneNumber: PhoneNumberFromApi, accountId: number) => {
  try {
    return await prisma.phoneNumber.upsert({
      where: { value: phoneNumber.display_phone_number },
      update: {
        certLastCheckedAt: new Date(),
        certAvailableAt: phoneNumber.certificate ? new Date() : null,
        qualityRating: phoneNumber.quality_rating,
        nameStatus: phoneNumber.name_status,
        verifiedName: phoneNumber.verified_name,
        status: phoneNumber.status,
        phoneNumberId: phoneNumber.id,
        shortenValue: getShortPhoneNumber(phoneNumber.display_phone_number),
        codeVerificationStatus: phoneNumber.code_verification_status,
      },
      create: {
        accountId,
        value: phoneNumber.display_phone_number,
        certLastCheckedAt: new Date(),
        certAvailableAt: phoneNumber.certificate ? new Date() : null,
        qualityRating: phoneNumber.quality_rating,
        nameStatus: phoneNumber.name_status,
        verifiedName: phoneNumber.verified_name,
        status: phoneNumber.status,
        phoneNumberId: phoneNumber.id,
        shortenValue: getShortPhoneNumber(phoneNumber.display_phone_number),
        codeVerificationStatus: phoneNumber.code_verification_status,
      },
    });
  } catch (error) {
    logger.error(error.message);
  }
};

export const deletePhoneNumber = async (id: number) => {
  try {
    return await prisma.phoneNumber.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(error.message);
  }
};

export const getPhoneNumberByIdAndPartnerId = async (phoneNumberId: number, partnerId: number) => {
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      phoneNumberId: phoneNumberId.toString(),
      account: {
        OR: [
          {
            manager: {
              partnerId,
            },
          },
          {
            user: {
              partner: {
                id: partnerId,
              },
            },
          },
        ],
      },
    },
  });
  if (!phoneNumber) throw new Error('No phone number found or you are not the owner of this phone number');
  return phoneNumber;
};

export const getPhoneStatus = async (phoneNumberId: number, partnerId: number): Promise<string> => {
  const phoneNumber = await getPhoneNumberByIdAndPartnerId(phoneNumberId, partnerId);
  return phoneNumber.status || 'NA';
};

export const getPhoneNameStatus = async (phoneNumberId: number, partnerId: number): Promise<string> => {
  const phoneNumber = await getPhoneNumberByIdAndPartnerId(phoneNumberId, partnerId);
  return phoneNumber.nameStatus || 'NA';
};

export const getQualityRating = async (phoneNumberId: number, partnerId: number): Promise<string> => {
  const phoneNumber = await getPhoneNumberByIdAndPartnerId(phoneNumberId, partnerId);
  switch (phoneNumber.qualityRating) {
    case 'GREEN':
      return 'HIGH';
    case 'YELLOW':
      return 'MEDIUM';
    case 'RED':
      return 'LOW';
    default:
      return phoneNumber.qualityRating || 'NA';
  }
};

export const updateCodeStatus = async (phoneNumberId: string): Promise<void> => {
  const phoneNumberFromFb = await getPhoneNumberFromFB(phoneNumberId);
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      phoneNumberId,
    },
  });
  if (!phoneNumber || !phoneNumberFromFb) return;
  await prisma.phoneNumber.update({
    where: {
      id: phoneNumber.id,
    },
    data: {
      certLastCheckedAt: new Date(),
      certAvailableAt: phoneNumberFromFb.certificate ? new Date() : null,
      qualityRating: phoneNumberFromFb.quality_rating,
      nameStatus: phoneNumberFromFb.name_status,
      verifiedName: phoneNumberFromFb.verified_name,
      status: phoneNumberFromFb.status,
      phoneNumberId: phoneNumberFromFb.id,
      shortenValue: getShortPhoneNumber(phoneNumberFromFb.display_phone_number),
      codeVerificationStatus: phoneNumberFromFb.code_verification_status,
    },
  });
};

export const getShortPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '');
};

export const fetchAndUpdatePhoneNumbers = async (account: Account) => {
  try {
    logger.info(`Migrating Phonenumbers for WABA ${account.name}`);
    const currentPhoneNumbers: PhoneNumber[] = await getAllPhoneNumbersOfWaba(account.userId, account.wabaId);
    const phoneNumbers = await api.getPhoneNumbers(account.wabaId);

    const results = currentPhoneNumbers.filter(
      ({ value }) => !phoneNumbers.some(({ display_phone_number }) => value === display_phone_number),
    );

    if (results) {
      results.forEach(async (phoneNumberDelete) => {
        await deletePhoneNumber(phoneNumberDelete.id);
      });
    }

    for (const phoneNumber of phoneNumbers) {
      logger.info(
        `Updating phone number name: ${phoneNumber.verified_name} | value: ${phoneNumber.display_phone_number}`,
      );
      await updateOrCreateAPhoneNumber(phoneNumber, account.id);
      logger.info(`Updated phone number name: ${phoneNumber.verified_name}`);
    }
  } catch (error) {
    logger.error(`Failed migrating Phonenumbers for WABA ${account.name} with error ${error.message}`);
    return;
  }
};

export const fetchCertForPhoneNumber = async () => {
  try {
    const phoneNumbersWithoutCert = await prisma.phoneNumber.findMany({
      where: {
        certAvailableAt: null,
      },
    });
    for (const phoneNumberWithoutCert of phoneNumbersWithoutCert) {
      try {
        logger.info(`Fetching phone number ${phoneNumberWithoutCert.shortenValue}`);
        if (!phoneNumberWithoutCert.phoneNumberId) continue;
        const fetchedPhoneNumber = await api.getPhoneNumber(phoneNumberWithoutCert.phoneNumberId);
        const {
          certificate,
          quality_rating,
          display_phone_number,
          name_status,
          verified_name,
          status,
          id,
          code_verification_status,
        } = fetchedPhoneNumber;
        await prisma.phoneNumber.update({
          where: {
            value: display_phone_number,
          },
          data: {
            certLastCheckedAt: new Date(),
            certAvailableAt: certificate ? new Date() : null,
            qualityRating: quality_rating,
            nameStatus: name_status,
            verifiedName: verified_name,
            status: status,
            phoneNumberId: id,
            shortenValue: getShortPhoneNumber(display_phone_number),
            codeVerificationStatus: code_verification_status,
          },
        });
      } catch (error) {
        logger.error(error.message);
        continue;
      }
    }
  } catch (error) {
    logger.error(error.message);
  }
};
