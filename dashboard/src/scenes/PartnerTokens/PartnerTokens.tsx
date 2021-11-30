import React, { useState, useEffect } from 'react';

import _ from 'lodash';
import { Button, Card } from 'antd';
import { compareDesc } from 'date-fns';

import * as api from '../../api';
import { PartnerToken } from '../../types';
import { PartnerTokensTable } from '.';

type Props = {
  partnerId: number;
};

function PartnerTokens({ partnerId }: Props) {
  const [partnerTokens, setPartnerTokens] = useState<PartnerToken[]>([]);
  const [sortedPartnerTokens, setSortedPartnerTokens] = useState<PartnerToken[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.partnerToken.find(partnerId);
      if (data) {
        setPartnerTokens(data);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!partnerTokens) {
      return;
    }
    const sortedTokens = partnerTokens.sort((token1, token2) => {
      return compareDesc(new Date(token1.createdAt), new Date(token2.createdAt));
    });
    setSortedPartnerTokens(sortedTokens);
  }, [partnerTokens]);

  const onClickGenerateToken = async () => {
    if (!partnerTokens) {
      return;
    }
    const data = await api.partnerToken.create(partnerId);
    if (!data) {
      return;
    }
    const _partnerTokens = _.cloneDeep(partnerTokens);
    _partnerTokens.push({ ...data, usage: 0 });
    setPartnerTokens(_partnerTokens);
  };

  const revokePartnerToken = async (partnerKeyId: number) => {
    try {
      const revokedPartnerToken = await api.partnerToken.revoke(partnerKeyId, partnerId);
      if (!partnerTokens || !revokedPartnerToken) {
        return;
      }
      const { revokedAt } = revokedPartnerToken;
      if (!revokedAt) return;
      const _partnerTokens = _.cloneDeep(partnerTokens);
      const partnerTokenIndex = _partnerTokens.findIndex((partnerToken) => partnerToken.id === partnerKeyId);
      _partnerTokens[partnerTokenIndex] = { ..._partnerTokens[partnerTokenIndex], revokedAt };
      setPartnerTokens(_partnerTokens);
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <Card className="text-center partner-tokens" title="Keys">
      <Button onClick={onClickGenerateToken} type="primary">
        Generate Key
      </Button>
      <div className="partner-table">
        {Array.isArray(sortedPartnerTokens) && (
          <PartnerTokensTable revokePartnerToken={revokePartnerToken} tokens={sortedPartnerTokens} />
        )}
      </div>
    </Card>
  );
}

export default PartnerTokens;
