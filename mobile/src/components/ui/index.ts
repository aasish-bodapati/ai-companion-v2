/**
 * UI Components Index - Centralized exports for all base components
 * Reduces complexity by providing a single import point
 */

// Base Components
export { default as BaseCard } from './BaseCard';
export { default as BaseButton } from './BaseButton';
export { default as BaseInput } from './BaseInput';
export { default as BaseModal } from './BaseModal';
export { default as BaseForm, useFormContext } from './BaseForm';

// Mobile-First Components
export { default as ThumbZoneLayout } from './ThumbZoneLayout';
export { default as MobileButton } from './MobileButton';
export { default as SwipeableCard } from './SwipeableCard';
export { default as FloatingActionButton } from './FloatingActionButton';

// Re-export types
export type { BaseCardProps } from './BaseCard';
export type { BaseButtonProps } from './BaseButton';
export type { BaseInputProps } from './BaseInput';
export type { BaseModalProps, ModalSize, ModalPosition } from './BaseModal';
export type { BaseFormProps, FormField, FormContextType } from './BaseForm';