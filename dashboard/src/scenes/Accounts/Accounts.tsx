import React, { useState, useEffect, useRef } from 'react';

import _ from 'lodash';
import { Card } from 'antd';

import * as api from '../../api';
import { Account, CreditLineState } from '../../types';
import { AccountsTable } from '.';
import { ExportCSV, SearchBar } from '../../components';

type Props = {
  isAdmin: boolean | null;
  partnerId: number | null;
};

function Accounts({ isAdmin, partnerId }: Props) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const prevSearchText = useRef(searchText);
  const [isLoading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    if (searchText !== prevSearchText.current) {
      setLoading(true);
    }
    const { accounts, total } = await api.account.find(false, page, size, searchText);
    setAccounts(accounts);
    setTotal(total);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [searchText, page, size]);

  const updateAccountList = (
    accountId: number,
    creditLineAllocationConfigId: string | null,
    creditLineState: CreditLineState,
  ) => {
    if (!accounts) {
      return;
    }
    const _accounts = _.cloneDeep(accounts);
    const accountIndex = _accounts.findIndex((account) => account.id === accountId);
    const account = _accounts[accountIndex];
    if (!account.manager) {
      return;
    }
    account.manager = { ...account.manager, creditLineAllocationConfigId, creditLineState };
    setAccounts(_accounts);
  };

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue);
    setPage(1);
  };

  const onPaginationChanged = (page: number, pageSize?: number | undefined) => {
    setPage(page);
    pageSize && setSize(pageSize);
  };

  const getExportData = async () => {
    const dataTable = await api.account.getExportData();
    return dataTable || [];
  };

  return (
    <Card className="accounts text-center" title="Accounts">
      {/* <Card.Text>All my accounts here</Card.Text> */}
      {accounts && (
        <>
          {(isAdmin || partnerId) && (
            <>
              <div className="flex flex-jc-sb flex-ai-c features-box">
                <div style={{ flex: 10 }}>
                  <SearchBar
                    placeholder="You are looking for ( WABA ID / WABA Name/ Business Name/ Partner Email) ..."
                    isLoading={isLoading}
                    onHandleSearch={handleSearch}
                  />
                </div>

                <div style={{ flex: 1 }} className="export">
                  <ExportCSV getExportData={getExportData} fileName={'accounts'} />
                </div>
              </div>
              <h4>Total {total}</h4>
            </>
          )}
          <AccountsTable
            accounts={accounts}
            isAdmin={isAdmin}
            partnerId={partnerId}
            page={page}
            size={size}
            total={total}
            updateAccountList={updateAccountList}
            onPaginationChanged={onPaginationChanged}
            fetchData={fetchData}
          />
        </>
      )}
    </Card>
  );
}

export default Accounts;
