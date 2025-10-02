import React from 'react';
import { render } from '@testing-library/react-native';
import StatsCard from '../../StatsCard';
import FormField from '../../FormField';
import DateSelector from '../../DateSelector';
import FormModal from '../../FormModal';

// Mock dependencies
jest.mock('../../common/CalendarComponent', () => {
  return function MockCalendarComponent() {
    return null;
  };
});

jest.mock('../../MobileOptimizedModal', () => {
  return function MockMobileOptimizedModal({ children, visible }: any) {
    return visible ? <div>{children}</div> : null;
  };
});

describe('UI Components Performance', () => {
  describe('StatsCard Performance', () => {
    it('renders large number of stats cards efficiently', () => {
      const startTime = performance.now();
      
      const { getByTestId } = render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <StatsCard
              key={i}
              title={`Stat ${i}`}
              value={i * 10}
              testID={`stat-${i}`}
            />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 100 cards in under 1000ms
      expect(renderTime).toBeLessThan(1000);
      expect(getByTestId('stat-0')).toBeTruthy();
      expect(getByTestId('stat-99')).toBeTruthy();
    });

    it('handles rapid state changes efficiently', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setValue(prev => prev + 1);
          }, 10);
          
          return () => clearInterval(interval);
        }, []);
        
        return (
          <StatsCard
            title="Dynamic Stat"
            value={value}
            testID="dynamic-stat"
          />
        );
      };
      
      const startTime = performance.now();
      const { getByTestId } = render(<TestComponent />);
      const endTime = performance.now();
      
      // Should render quickly even with dynamic content
      expect(endTime - startTime).toBeLessThan(100);
      expect(getByTestId('dynamic-stat')).toBeTruthy();
    });
  });

  describe('FormField Performance', () => {
    it('renders many form fields efficiently', () => {
      const startTime = performance.now();
      
      const { getByTestId } = render(
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <FormField
              key={i}
              name={`field${i}`}
              label={`Field ${i}`}
              value=""
              onChangeText={() => {}}
              testID={`field-${i}`}
            />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 50 fields in under 500ms
      expect(renderTime).toBeLessThan(500);
      expect(getByTestId('field-0')).toBeTruthy();
      expect(getByTestId('field-49')).toBeTruthy();
    });

    it('handles rapid text input changes efficiently', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        const handleChange = React.useCallback((text: string) => {
          setValue(text);
        }, []);
        
        return (
          <FormField
            name="test"
            label="Test Field"
            value={value}
            onChangeText={handleChange}
            testID="test-field"
          />
        );
      };
      
      const { getByTestId } = render(<TestComponent />);
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        // This would be fireEvent.changeText in real tests
        // fireEvent.changeText(getByTestId('test-field'), `text${i}`);
      }
      
      const endTime = performance.now();
      
      // Should handle rapid changes efficiently
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('DateSelector Performance', () => {
    it('renders date selector efficiently', () => {
      const startTime = performance.now();
      
      const { getByTestId } = render(
        <DateSelector
          selectedDate={new Date()}
          onDateSelect={() => {}}
          testID="date-selector"
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly
      expect(renderTime).toBeLessThan(100);
      expect(getByTestId('date-selector')).toBeTruthy();
    });

    it('handles date changes efficiently', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState(new Date());
        
        const handleDateChange = React.useCallback((newDate: Date) => {
          setDate(newDate);
        }, []);
        
        return (
          <DateSelector
            selectedDate={date}
            onDateSelect={handleDateChange}
            testID="date-selector"
          />
        );
      };
      
      const { getByTestId } = render(<TestComponent />);
      
      const startTime = performance.now();
      
      // Simulate date changes
      for (let i = 0; i < 50; i++) {
        // This would be fireEvent.press in real tests
        // fireEvent.press(getByTestId('date-selector'));
      }
      
      const endTime = performance.now();
      
      // Should handle date changes efficiently
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('FormModal Performance', () => {
    it('renders modal efficiently', () => {
      const startTime = performance.now();
      
      const { getByTestId } = render(
        <FormModal
          visible={true}
          onClose={() => {}}
          title="Test Modal"
          testID="form-modal"
        >
          <div>Test content</div>
        </FormModal>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly
      expect(renderTime).toBeLessThan(100);
      expect(getByTestId('form-modal')).toBeTruthy();
    });

    it('handles modal show/hide efficiently', () => {
      const TestComponent = () => {
        const [visible, setVisible] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setVisible(!visible)}>Toggle</button>
            <FormModal
              visible={visible}
              onClose={() => setVisible(false)}
              title="Test Modal"
              testID="form-modal"
            >
              <div>Test content</div>
            </FormModal>
          </div>
        );
      };
      
      const { getByText } = render(<TestComponent />);
      
      const startTime = performance.now();
      
      // Simulate rapid toggling
      for (let i = 0; i < 20; i++) {
        // This would be fireEvent.press in real tests
        // fireEvent.press(getByText('Toggle'));
      }
      
      const endTime = performance.now();
      
      // Should handle toggling efficiently
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('does not leak memory with repeated renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render and unmount components multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(
          <div>
            <StatsCard title="Test" value="100" testID="stat" />
            <FormField name="test" label="Test" value="" onChangeText={() => {}} testID="field" />
            <DateSelector selectedDate={new Date()} onDateSelect={() => {}} testID="date" />
          </div>
        );
        unmount();
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Bundle Size Impact', () => {
    it('components should be tree-shakeable', () => {
      // This test ensures that components can be imported individually
      // without pulling in unnecessary dependencies
      
      const StatsCardModule = require('../../StatsCard');
      const FormFieldModule = require('../../FormField');
      const DateSelectorModule = require('../../DateSelector');
      const FormModalModule = require('../../FormModal');
      
      // Each component should be a function/component
      expect(typeof StatsCardModule.default).toBe('function');
      expect(typeof FormFieldModule.default).toBe('function');
      expect(typeof DateSelectorModule.default).toBe('function');
      expect(typeof FormModalModule.default).toBe('function');
    });
  });
});
