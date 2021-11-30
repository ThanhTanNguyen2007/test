import React, { useState, useEffect, useRef } from 'react';

import _ from 'lodash';
import { Card } from 'antd';

import * as api from '../../api';
import { Partner, User } from '../../types';
import { UsersTable } from '.';
import { SearchBar } from '../../components';

type UsersProps = {
  isAdmin: boolean | null;
};

function Users({ isAdmin }: UsersProps) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const prevSearchText = useRef(searchText);
  const [isLoading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (searchText !== prevSearchText.current) {
        setLoading(true);
      }
      const { users, total } = await api.user.find(searchText, page, size);
      setUsers(users);
      setTotal(total);
      setLoading(false);
    };
    fetchData();
  }, [searchText, page, size]);

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue);
    setPage(1);
  };

  const changePartnerActivation = (updatedPartner: Partner) => {
    if (!users) return;

    const _users = _.cloneDeep(users);
    const userIndex = _users.findIndex((user) => user.partner?.id === updatedPartner.id);
    _users[userIndex] = { ..._users[userIndex], partner: updatedPartner };
    setUsers(_users);
  };
  const updateUserPartnerInfo = (userId: number, partner: Partner, timezone: string) => {
    if (!users) {
      return;
    }
    const _users = _.cloneDeep(users);
    const userIndex = _users.findIndex((user) => user.id === userId);
    _users[userIndex] = {
      ..._users[userIndex],
      partner: { id: partner.id, timezone, isActivated: partner.isActivated },
    };
    setUsers(_users);
  };

  const onPaginationChanged = (page: number, pageSize?: number | undefined) => {
    setPage(page);
    pageSize && setSize(pageSize);
  };

  return (
    <Card title="Users" className="text-center users">
      {users && (
        <>
          <SearchBar
            placeholder="You are looking for (Email/ Partner Email) ..."
            isLoading={isLoading}
            onHandleSearch={handleSearch}
          />
          <h4>Total {total}</h4>
          <UsersTable
            isAdmin={isAdmin}
            users={users}
            page={page}
            size={size}
            total={total}
            updateUserPartnerInfo={updateUserPartnerInfo}
            changePartnerActivation={changePartnerActivation}
            onPaginationChanged={onPaginationChanged}
          />
        </>
      )}
    </Card>
  );
}

export default Users;
