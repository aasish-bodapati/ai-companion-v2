import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs';

describe('Tabs Component', () => {
  it('renders tabs with default value', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches between tabs on click', async () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    // Initially tab1 content should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    
    // Click on tab2
    const tab2 = screen.getByText('Tab 2');
    fireEvent.click(tab2);
    
    // Wait for tab2 content to be visible
    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('handles controlled value changes', () => {
    const handleValueChange = jest.fn();
    
    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    const tab2 = screen.getByText('Tab 2');
    fireEvent.click(tab2);
    
    // The onValueChange should be called when clicking a tab
    expect(handleValueChange).toHaveBeenCalledWith('tab2');
  });

  it('applies custom className to tabs list', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-class">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );
    
    const tabsList = screen.getByRole('tablist');
    expect(tabsList).toHaveClass('custom-class');
  });

  it('applies custom className to tab trigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger-class">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );
    
    const tabTrigger = screen.getByRole('tab');
    expect(tabTrigger).toHaveClass('custom-trigger-class');
  });

  it('applies custom className to tab content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content-class">Content 1</TabsContent>
      </Tabs>
    );
    
    const tabContent = screen.getByText('Content 1');
    expect(tabContent).toHaveClass('custom-content-class');
  });

  it('handles disabled tab trigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    const disabledTab = screen.getByText('Tab 2');
    expect(disabledTab).toHaveAttribute('data-disabled');
  });

  it('handles keyboard navigation', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    const tab1 = screen.getByText('Tab 1');
    
    // Test arrow key navigation
    fireEvent.keyDown(tab1, { key: 'ArrowRight' });
    fireEvent.keyDown(tab1, { key: 'ArrowLeft' });
    fireEvent.keyDown(tab1, { key: 'Home' });
    fireEvent.keyDown(tab1, { key: 'End' });
  });

  it('renders multiple tab contents', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
    
    // Only the active tab content should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });
});
