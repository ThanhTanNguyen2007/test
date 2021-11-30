import React, { useState, useEffect } from 'react';
import { Input } from 'antd';

const { Search } = Input;

type Props = {
  placeholder: string;
  isLoading: boolean;
  onHandleSearch(searchValue: string): void;
  searchTextDefault?: string;
};

const SearchBar = ({ searchTextDefault, placeholder, isLoading, onHandleSearch }: Props) => {
  const [searchText, setSearchText] = useState<string>();

  const handleSearchChange = (searchValue: string) => {
    onHandleSearch(searchValue);
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.value === '') {
      handleSearchChange('');
    }
    setSearchText(e.currentTarget.value);
  };

  useEffect(() => {
    if (searchTextDefault) {
      setSearchText(searchTextDefault);
    }
  }, []);

  return (
    <>
      <Search
        placeholder={placeholder}
        enterButton="Search"
        bordered
        autoFocus
        value={searchText}
        allowClear={true}
        loading={isLoading}
        onChange={(e) => handleOnChange(e)}
        onPressEnter={(e) => handleSearchChange(e.currentTarget.value)}
        size="middle"
        onSearch={handleSearchChange}
      />
    </>
  );
};

export default SearchBar;
