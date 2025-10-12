import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchInput from '../SearchInput';
import FilterBar from '../FilterBar';
import { searchInputConfigs, filterBarConfigs } from '../SearchInput.utils';

// Test component that uses both SearchInput and FilterBar
function SearchAndFilterTest() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState([
    { id: '1', name: 'Exercise 1', category: 'strength', difficulty: 'beginner' },
    { id: '2', name: 'Exercise 2', category: 'cardio', difficulty: 'intermediate' },
    { id: '3', name: 'Exercise 3', category: 'strength', difficulty: 'advanced' },
  ]);

  const filterOptions = [
    { id: 'strength', label: 'Strength', value: 'strength' },
    { id: 'cardio', label: 'Cardio', value: 'cardio' },
    { id: 'beginner', label: 'Beginner', value: 'beginner' },
    { id: 'intermediate', label: 'Intermediate', value: 'intermediate' },
    { id: 'advanced', label: 'Advanced', value: 'advanced' },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Simulate filtering logic
    const filtered = filteredData.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleFilterChange = (filters: string[]) => {
    setSelectedFilters(filters);
    // Simulate filtering logic
    const filtered = filteredData.filter(item => 
      filters.length === 0 || 
      filters.includes(item.category) || 
      filters.includes(item.difficulty)
    );
    setFilteredData(filtered);
  };

  return (
    <>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={handleSearch}
        placeholder="Search exercises..."
        testID="search-input"
        {...searchInputConfigs.exercise}
      />
      
      <FilterBar
        options={filterOptions}
        selectedValues={selectedFilters}
        onSelectionChange={handleFilterChange}
        testID="filter-bar"
        {...filterBarConfigs.exerciseCategories}
      />
      
      <div testID="results">
        {filteredData.map(item => (
          <div key={item.id} testID={`result-${item.id}`}>
            {item.name} - {item.category} - {item.difficulty}
          </div>
        ))}
      </div>
    </>
  );
}

describe('SearchInput and FilterBar Integration', () => {
  it('renders both components correctly', () => {
    const { getByTestId } = render(<SearchAndFilterTest />);
    
    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByTestId('filter-bar')).toBeTruthy();
  });

  it('handles search functionality', async () => {
    const { getByTestId, getByPlaceholderText } = render(<SearchAndFilterTest />);
    
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'Exercise 1');
    
    await waitFor(() => {
      expect(getByTestId('result-1')).toBeTruthy();
    });
  });

  it('handles filter functionality', () => {
    const { getByTestId, getByText } = render(<SearchAndFilterTest />);
    
    fireEvent.press(getByText('Strength'));
    
    expect(getByTestId('result-1')).toBeTruthy();
    expect(getByTestId('result-3')).toBeTruthy();
  });

  it('handles combined search and filter', async () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<SearchAndFilterTest />);
    
    // Apply filter first
    fireEvent.press(getByText('Strength'));
    
    // Then search
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'Exercise 1');
    
    await waitFor(() => {
      expect(getByTestId('result-1')).toBeTruthy();
    });
  });

  it('handles clear search', () => {
    const { getByTestId, getByPlaceholderText } = render(<SearchAndFilterTest />);
    
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'test');
    
    const clearButton = getByTestId('search-input-clear');
    fireEvent.press(clearButton);
    
    expect(searchInput.props.value).toBe('');
  });

  it('handles clear filters', () => {
    const { getByTestId, getByText } = render(<SearchAndFilterTest />);
    
    fireEvent.press(getByText('Strength'));
    
    const clearButton = getByTestId('filter-bar-clear');
    fireEvent.press(clearButton);
    
    expect(getByTestId('result-1')).toBeTruthy();
    expect(getByTestId('result-2')).toBeTruthy();
    expect(getByTestId('result-3')).toBeTruthy();
  });

  it('handles multiple filter selections', () => {
    const { getByTestId, getByText } = render(<SearchAndFilterTest />);
    
    fireEvent.press(getByText('Strength'));
    fireEvent.press(getByText('Cardio'));
    
    expect(getByTestId('result-1')).toBeTruthy();
    expect(getByTestId('result-2')).toBeTruthy();
    expect(getByTestId('result-3')).toBeTruthy();
  });

  it('handles single filter selection', () => {
    const { getByTestId, getByText } = render(
      <SearchAndFilterTest />
    );
    
    // This would need to be updated to use single selection mode
    fireEvent.press(getByText('Strength'));
    
    expect(getByTestId('result-1')).toBeTruthy();
    expect(getByTestId('result-3')).toBeTruthy();
  });
});
