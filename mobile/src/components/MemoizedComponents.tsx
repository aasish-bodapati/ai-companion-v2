import React from 'react';
import { withMemo } from '../hooks/usePerformance';

// Memoized button component
export const MemoizedButton = withMemo(function MemoizedButton({
  title,
  onPress,
  style,
  disabled = false,
  ...props
}: {
  title: string;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      style={style}
      {...props}
    >
      {title}
    </button>
  );
});

// Memoized text component
export const MemoizedText = withMemo(function MemoizedText({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}) {
  return (
    <span style={style} {...props}>
      {children}
    </span>
  );
});

// Memoized view component
export const MemoizedView = withMemo(function MemoizedView({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}) {
  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
});

// Memoized input component
export const MemoizedInput = withMemo(function MemoizedInput({
  value,
  onChangeText,
  placeholder,
  style,
  ...props
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  [key: string]: any;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
      style={style}
      {...props}
    />
  );
});

// Memoized list item component
export const MemoizedListItem = withMemo(function MemoizedListItem({
  item,
  onPress,
  style,
  ...props
}: {
  item: any;
  onPress: (item: any) => void;
  style?: any;
  [key: string]: any;
}) {
  return (
    <div
      onClick={() => onPress(item)}
      style={style}
      {...props}
    >
      {item.title || item.name || item.toString()}
    </div>
  );
});

// Memoized card component
export const MemoizedCard = withMemo(function MemoizedCard({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

// Memoized modal component
export const MemoizedModal = withMemo(function MemoizedModal({
  visible,
  onClose,
  children,
  style,
  ...props
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        ...style,
      }}
      onClick={onClose}
      {...props}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 24,
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default {
  MemoizedButton,
  MemoizedText,
  MemoizedView,
  MemoizedInput,
  MemoizedListItem,
  MemoizedCard,
  MemoizedModal,
};
