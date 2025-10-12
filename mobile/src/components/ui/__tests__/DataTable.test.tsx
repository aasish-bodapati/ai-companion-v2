import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DataTable from '../DataTable';

describe('DataTable', () => {
  const mockData = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
  ];

  const mockColumns = [
    { key: 'id', title: 'ID', dataIndex: 'id', sortable: true },
    { key: 'name', title: 'Name', dataIndex: 'name', sortable: true },
    { key: 'age', title: 'Age', dataIndex: 'age', sortable: true },
    { key: 'email', title: 'Email', dataIndex: 'email', sortable: true },
  ];

  const mockOnPageChange = jest.fn();
  const mockOnSelectionChange = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with data and columns', () => {
    const { getByText } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        testID="data-table"
      />
    );
    
    expect(getByText('ID')).toBeTruthy();
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Age')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Jane Smith')).toBeTruthy();
    expect(getByText('Bob Johnson')).toBeTruthy();
  });

  it('handles sorting when column header is pressed', () => {
    const { getByText } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onSortChange={mockOnSortChange}
        testID="data-table"
      />
    );
    
    fireEvent.press(getByText('Name'));
    
    expect(mockOnSortChange).toHaveBeenCalledWith('name', 'asc');
  });

  it('handles row selection when selectable is true', () => {
    const { getByTestId } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedRowKeys={[]}
        onSelectionChange={mockOnSelectionChange}
        testID="data-table"
      />
    );
    
    const firstRow = getByTestId('data-table-row-0');
    fireEvent.press(firstRow);
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1'], [mockData[0]]);
  });

  it('handles pagination when enabled', () => {
    const { getByText } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={true}
        pageSize={2}
        currentPage={1}
        onPageChange={mockOnPageChange}
        testID="data-table"
      />
    );
    
    // Should show only 2 items per page
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Jane Smith')).toBeTruthy();
    // Bob Johnson should not be visible on first page
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        size="small"
        testID="data-table"
      />
    );
    
    rerender(
      <DataTable
        data={mockData}
        columns={mockColumns}
        size="medium"
        testID="data-table"
      />
    );
    
    rerender(
      <DataTable
        data={mockData}
        columns={mockColumns}
        size="large"
        testID="data-table"
      />
    );
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        variant="default"
        testID="data-table"
      />
    );
    
    rerender(
      <DataTable
        data={mockData}
        columns={mockColumns}
        variant="minimal"
        testID="data-table"
      />
    );
    
    rerender(
      <DataTable
        data={mockData}
        columns={mockColumns}
        variant="bordered"
        testID="data-table"
      />
    );
    
    rerender(
      <DataTable
        data={mockData}
        columns={mockColumns}
        variant="striped"
        testID="data-table"
      />
    );
  });

  it('handles custom render functions', () => {
    const columnsWithRender = [
      { key: 'id', title: 'ID', dataIndex: 'id' },
      { 
        key: 'name', 
        title: 'Name', 
        dataIndex: 'name',
        render: (value: string) => <Text testID="custom-name">{value.toUpperCase()}</Text>
      },
    ];

    const { getByTestId } = render(
      <DataTable
        data={mockData}
        columns={columnsWithRender}
        testID="data-table"
      />
    );
    
    expect(getByTestId('custom-name')).toBeTruthy();
  });

  it('handles loading state', () => {
    const { getByTestId } = render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading={true}
        testID="data-table"
      />
    );
    
    expect(getByTestId('data-table')).toBeTruthy();
  });

  it('handles empty data', () => {
    const { getByText } = render(
      <DataTable
        data={[]}
        columns={mockColumns}
        testID="data-table"
      />
    );
    
    expect(getByText('ID')).toBeTruthy();
    expect(getByText('Name')).toBeTruthy();
  });

  it('handles row press events', () => {
    const mockOnRowPress = jest.fn();
    
    const { getByTestId } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowPress={mockOnRowPress}
        testID="data-table"
      />
    );
    
    const firstRow = getByTestId('data-table-row-0');
    fireEvent.press(firstRow);
    
    expect(mockOnRowPress).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('handles row long press events', () => {
    const mockOnRowLongPress = jest.fn();
    
    const { getByTestId } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowLongPress={mockOnRowLongPress}
        testID="data-table"
      />
    );
    
    const firstRow = getByTestId('data-table-row-0');
    fireEvent(firstRow, 'longPress');
    
    expect(mockOnRowLongPress).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    
    const { getByTestId } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        containerStyle={customStyle}
        testID="data-table"
      />
    );
    
    expect(getByTestId('data-table')).toHaveStyle(customStyle);
  });

  it('handles disabled sorting', () => {
    const columnsWithDisabledSort = [
      { key: 'id', title: 'ID', dataIndex: 'id', sortable: false },
      { key: 'name', title: 'Name', dataIndex: 'name', sortable: true },
    ];

    const { getByText } = render(
      <DataTable
        data={mockData}
        columns={columnsWithDisabledSort}
        onSortChange={mockOnSortChange}
        testID="data-table"
      />
    );
    
    fireEvent.press(getByText('ID'));
    
    expect(mockOnSortChange).not.toHaveBeenCalled();
  });

  it('handles custom row key function', () => {
    const customRowKey = (record: any) => `custom-${record.id}`;
    
    const { getByTestId } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        rowKey={customRowKey}
        selectable={true}
        selectedRowKeys={[]}
        onSelectionChange={mockOnSelectionChange}
        testID="data-table"
      />
    );
    
    const firstRow = getByTestId('data-table-row-0');
    fireEvent.press(firstRow);
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['custom-1'], [mockData[0]]);
  });
});
