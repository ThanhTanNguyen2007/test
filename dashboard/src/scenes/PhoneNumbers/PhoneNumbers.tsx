import React, { useState, useEffect, useRef } from 'react';

import { Card } from 'antd';

import * as api from '../../api';
import { PhoneNumber } from '../../types';
import { PhoneNumbersTable } from '.';
import { SearchBar } from '../../components';
import { useLocation } from 'react-router-dom';

type Props = {
  isAdmin: boolean | null;
  partnerId: number | null;
};

function PhoneNumbers({ isAdmin, partnerId }: Props) {
  const location = useLocation<{ wabaId: string }>();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>(location.state?.wabaId && location.state.wabaId);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const prevSearchText = useRef(searchText);

  const fetchData = async () => {
    try {
      if (searchText !== prevSearchText.current) {
        setIsSearching(true);
      }

      // const accountId = filterAccountId == 'all' ? '' : filterAccountId;
      const { total, phoneNumbers } = await api.phoneNumber.find(false, page, size, searchText);
      setPhoneNumbers(phoneNumbers);
      setTotal(total);
      setIsSearching(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchText, page, size]);

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue);
    setPage(1);
  };

  const onPaginationChanged = (page: number, pageSize?: number | undefined) => {
    setPage(page);
    pageSize && setSize(pageSize);
  };

  //Add rowSpan field to array
  const createNewArray = (phoneNumbers: PhoneNumber[]) => {
    type NewPhonesListType = (PhoneNumber & { rowSpan: number })[];
    //Create a hashtable with key is accoundId and value is array of phoneNumbers have common accoundId
    const sameWabaMap = new Map<string, NewPhonesListType>();
    for (let index = 0; index < phoneNumbers.length; index++) {
      //Add field rowSpan default equal to 0 to phoneNumbers
      const newPhoneNumber = { ...phoneNumbers[index], rowSpan: 0 };
      const remainingValue = sameWabaMap.get(newPhoneNumber.accountId.toString());
      if (remainingValue) {
        remainingValue.push(newPhoneNumber);
        sameWabaMap.set(newPhoneNumber.accountId.toString(), remainingValue);
      } else {
        sameWabaMap.set(newPhoneNumber.accountId.toString(), [newPhoneNumber]);
      }
    }

    //
    let newPhoneNumbersList: NewPhonesListType = [];
    sameWabaMap.forEach((values: NewPhonesListType) => {
      values[0].rowSpan = values.length;
      newPhoneNumbersList = newPhoneNumbersList.concat(...values);
    });

    return newPhoneNumbersList;
  };

  return (
    <Card className="phoneNumbers text-center" title="Phone Numbers">
      {/* <Card.Text>All my accounts here</Card.Text> */}
      {phoneNumbers && (
        <>
          {(isAdmin || partnerId) && (
            <>
              <div className="flex flex-jc-sb flex-ai-c features-box">
                <SearchBar
                  placeholder="You are looking for ( Waba Id / Waba Name / Value / Name) ..."
                  isLoading={isSearching}
                  onHandleSearch={handleSearch}
                  searchTextDefault={location.state?.wabaId && location.state.wabaId}
                />
              </div>
              <h4>Total {total}</h4>
            </>
          )}
          <PhoneNumbersTable
            phoneNumbers={createNewArray(phoneNumbers)}
            isAdmin={isAdmin}
            partnerId={partnerId}
            page={page}
            size={size}
            total={total}
            onPaginationChanged={onPaginationChanged}
            fetchData={fetchData}
          />
        </>
      )}
    </Card>
  );
}

export default PhoneNumbers;
