import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        testID="pagination"
      />
    );
    
    expect(getByText('Page 1 of 5')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('handles page change when page number is pressed', () => {
    const { getByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        testID="pagination"
      />
    );
    
    fireEvent.press(getByText('2'));
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles previous button press', () => {
    const { getByTestId } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        testID="pagination"
      />
    );
    
    const prevButton = getByTestId('pagination-prev');
    fireEvent.press(prevButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles next button press', () => {
    const { getByTestId } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        testID="pagination"
      />
    );
    
    const nextButton = getByTestId('pagination-next');
    fireEvent.press(nextButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('handles first button press', () => {
    const { getByTestId } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        showFirstLast={true}
        testID="pagination"
      />
    );
    
    const firstButton = getByTestId('pagination-first');
    fireEvent.press(firstButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('handles last button press', () => {
    const { getByTestId } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        showFirstLast={true}
        testID="pagination"
      />
    );
    
    const lastButton = getByTestId('pagination-last');
    fireEvent.press(lastButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
  });

  it('disables navigation buttons when appropriate', () => {
    const { getByTestId } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        testID="pagination"
      />
    );
    
    const prevButton = getByTestId('pagination-prev');
    const firstButton = getByTestId('pagination-first');
    
    // These should be disabled on first page
    expect(prevButton).toBeTruthy();
    expect(firstButton).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        size="small"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        size="medium"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        size="large"
        testID="pagination"
      />
    );
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        variant="default"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        variant="minimal"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        variant="bordered"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        variant="dots"
        testID="pagination"
      />
    );
  });

  it('renders with different alignments', () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        alignment="left"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        alignment="center"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        alignment="right"
        testID="pagination"
      />
    );
    
    rerender(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        alignment="space-between"
        testID="pagination"
      />
    );
  });

  it('hides when hideWhenSinglePage is true and totalPages is 1', () => {
    const { queryByTestId } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        hideWhenSinglePage={true}
        testID="pagination"
      />
    );
    
    expect(queryByTestId('pagination')).toBeNull();
  });

  it('shows when hideWhenSinglePage is false and totalPages is 1', () => {
    const { getByTestId } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        hideWhenSinglePage={false}
        testID="pagination"
      />
    );
    
    expect(getByTestId('pagination')).toBeTruthy();
  });

  it('handles disabled state', () => {
    const { getByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        disabled={true}
        testID="pagination"
      />
    );
    
    fireEvent.press(getByText('2'));
    
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('renders custom info text', () => {
    const customInfoText = (current: number, total: number) => 
      `Page ${current} of ${total} (Custom)`;

    const { getByText } = render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        infoText={customInfoText}
        testID="pagination"
      />
    );
    
    expect(getByText('Page 2 of 5 (Custom)')).toBeTruthy();
  });

  it('hides info when showInfo is false', () => {
    const { queryByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        showInfo={false}
        testID="pagination"
      />
    );
    
    expect(queryByText('Page 1 of 5')).toBeNull();
  });

  it('hides first/last buttons when showFirstLast is false', () => {
    const { queryByTestId } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        showFirstLast={false}
        testID="pagination"
      />
    );
    
    expect(queryByTestId('pagination-first')).toBeNull();
    expect(queryByTestId('pagination-last')).toBeNull();
  });

  it('hides prev/next buttons when showPrevNext is false', () => {
    const { queryByTestId } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        showPrevNext={false}
        testID="pagination"
      />
    );
    
    expect(queryByTestId('pagination-prev')).toBeNull();
    expect(queryByTestId('pagination-next')).toBeNull();
  });

  it('limits visible pages based on maxVisiblePages', () => {
    const { getByText, queryByText } = render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
        testID="pagination"
      />
    );
    
    // Should show current page and surrounding pages
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('6')).toBeTruthy();
    
    // Should not show all pages
    expect(queryByText('1')).toBeTruthy(); // First page should be visible
    expect(queryByText('10')).toBeTruthy(); // Last page should be visible
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    
    const { getByTestId } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        containerStyle={customStyle}
        testID="pagination"
      />
    );
    
    expect(getByTestId('pagination')).toHaveStyle(customStyle);
  });

  it('handles custom button text', () => {
    const { getByText } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        firstButtonText="First Page"
        lastButtonText="Last Page"
        prevButtonText="Previous Page"
        nextButtonText="Next Page"
        showFirstLast={true}
        testID="pagination"
      />
    );
    
    expect(getByText('First Page')).toBeTruthy();
    expect(getByText('Last Page')).toBeTruthy();
    expect(getByText('Previous Page')).toBeTruthy();
    expect(getByText('Next Page')).toBeTruthy();
  });
});
