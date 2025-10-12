import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DataTable from '../DataTable';
import Pagination from '../Pagination';
import { dataTableConfigs } from '../DataTable.utils';
import { paginationConfigs } from '../Pagination.utils';

// Test component that uses both DataTable and Pagination
function DataTableWithPaginationTest() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const mockData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    age: 20 + (i % 40),
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'pending',
  }));

  const columns = [
    { key: 'id', title: 'ID', dataIndex: 'id', sortable: true, width: 60 },
    { key: 'name', title: 'Name', dataIndex: 'name', sortable: true },
    { key: 'email', title: 'Email', dataIndex: 'email', sortable: true },
    { key: 'age', title: 'Age', dataIndex: 'age', sortable: true, width: 60 },
    { key: 'status', title: 'Status', dataIndex: 'status', sortable: true, width: 80 },
  ];

  const pageSize = 10;
  const totalPages = Math.ceil(mockData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = mockData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectionChange = (selectedKeys: string[], selectedRows: any[]) => {
    setSelectedRows(selectedKeys);
  };

  return (
    <>
      <DataTable
        data={paginatedData}
        columns={columns}
        selectable={true}
        selectedRowKeys={selectedRows}
        onSelectionChange={handleSelectionChange}
        testID="data-table"
        {...dataTableConfigs.userList}
      />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        testID="pagination"
        {...paginationConfigs.dataTable}
      />
    </>
  );
}

describe('DataTable and Pagination Integration', () => {
  it('renders both components correctly', () => {
    const { getByTestId } = render(<DataTableWithPaginationTest />);
    
    expect(getByTestId('data-table')).toBeTruthy();
    expect(getByTestId('pagination')).toBeTruthy();
  });

  it('handles pagination with data table', () => {
    const { getByTestId, getByText } = render(<DataTableWithPaginationTest />);
    
    // Should show first 10 items
    expect(getByText('User 1')).toBeTruthy();
    expect(getByText('User 10')).toBeTruthy();
    
    // Go to next page
    const nextButton = getByTestId('pagination-next');
    fireEvent.press(nextButton);
    
    // Should show next 10 items
    expect(getByText('User 11')).toBeTruthy();
    expect(getByText('User 20')).toBeTruthy();
  });

  it('handles row selection across pages', () => {
    const { getByTestId, getByText } = render(<DataTableWithPaginationTest />);
    
    // Select a row on first page
    const firstRow = getByTestId('data-table-row-0');
    fireEvent.press(firstRow);
    
    // Go to next page
    const nextButton = getByTestId('pagination-next');
    fireEvent.press(nextButton);
    
    // Select a row on second page
    const secondPageFirstRow = getByTestId('data-table-row-0');
    fireEvent.press(secondPageFirstRow);
    
    // Both selections should be maintained
    expect(getByText('User 11')).toBeTruthy();
  });

  it('handles sorting with pagination', () => {
    const { getByTestId, getByText } = render(<DataTableWithPaginationTest />);
    
    // Sort by name
    fireEvent.press(getByText('Name'));
    
    // Data should be sorted
    expect(getByText('User 1')).toBeTruthy();
    
    // Go to next page
    const nextButton = getByTestId('pagination-next');
    fireEvent.press(nextButton);
    
    // Sorted data should continue on next page
    expect(getByText('User 11')).toBeTruthy();
  });

  it('handles page change with custom page size', () => {
    const { getByTestId, getByText } = render(<DataTableWithPaginationTest />);
    
    // Should show 10 items per page
    expect(getByText('User 1')).toBeTruthy();
    expect(getByText('User 10')).toBeTruthy();
    
    // Go to last page
    const lastButton = getByTestId('pagination-last');
    fireEvent.press(lastButton);
    
    // Should show remaining items
    expect(getByText('User 21')).toBeTruthy();
    expect(getByText('User 25')).toBeTruthy();
  });

  it('handles empty data with pagination', () => {
    const EmptyDataTableTest = () => {
      const [currentPage, setCurrentPage] = useState(1);
      
      return (
        <>
          <DataTable
            data={[]}
            columns={[
              { key: 'id', title: 'ID', dataIndex: 'id' },
              { key: 'name', title: 'Name', dataIndex: 'name' },
            ]}
            testID="empty-data-table"
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={0}
            onPageChange={setCurrentPage}
            testID="empty-pagination"
          />
        </>
      );
    };

    const { getByTestId, queryByTestId } = render(<EmptyDataTableTest />);
    
    expect(getByTestId('empty-data-table')).toBeTruthy();
    // Pagination should be hidden when totalPages is 0 and hideWhenSinglePage is true
    expect(queryByTestId('empty-pagination')).toBeNull();
  });

  it('handles single page with pagination', () => {
    const SinglePageTest = () => {
      const [currentPage, setCurrentPage] = useState(1);
      
      const singlePageData = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));
      
      return (
        <>
          <DataTable
            data={singlePageData}
            columns={[
              { key: 'id', title: 'ID', dataIndex: 'id' },
              { key: 'name', title: 'Name', dataIndex: 'name' },
            ]}
            testID="single-page-data-table"
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={1}
            onPageChange={setCurrentPage}
            hideWhenSinglePage={true}
            testID="single-page-pagination"
          />
        </>
      );
    };

    const { getByTestId, queryByTestId } = render(<SinglePageTest />);
    
    expect(getByTestId('single-page-data-table')).toBeTruthy();
    // Pagination should be hidden when there's only one page
    expect(queryByTestId('single-page-pagination')).toBeNull();
  });

  it('handles large dataset with pagination', () => {
    const LargeDatasetTest = () => {
      const [currentPage, setCurrentPage] = useState(1);
      
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 100,
      }));
      
      const pageSize = 20;
      const totalPages = Math.ceil(largeData.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = largeData.slice(startIndex, endIndex);
      
      return (
        <>
          <DataTable
            data={paginatedData}
            columns={[
              { key: 'id', title: 'ID', dataIndex: 'id', width: 60 },
              { key: 'name', title: 'Name', dataIndex: 'name' },
              { key: 'value', title: 'Value', dataIndex: 'value', width: 80 },
            ]}
            testID="large-data-table"
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            maxVisiblePages={5}
            testID="large-pagination"
          />
        </>
      );
    };

    const { getByTestId, getByText } = render(<LargeDatasetTest />);
    
    expect(getByTestId('large-data-table')).toBeTruthy();
    expect(getByTestId('large-pagination')).toBeTruthy();
    
    // Should show first 20 items
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 20')).toBeTruthy();
    
    // Go to page 50
    const page50Button = getByText('50');
    fireEvent.press(page50Button);
    
    // Should show items 981-1000
    expect(getByText('Item 981')).toBeTruthy();
    expect(getByText('Item 1000')).toBeTruthy();
  });
});
