# UI Component Reference

## Design System

### Colors
```typescript
const colors = {
  // Primary
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Base primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Secondary
  secondary: {
    400: '#a5b4fc',
    500: '#818cf8',
    600: '#6366f1',
  },
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
}
```

### Typography
- **Font Family**: `Inter`, `system-ui`, `sans-serif`
- **Base Font Size**: `16px`
- **Scale**: 1.2 (Major Third)

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Core Components

### 1. Button
**Location**: `components/common/Button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Button 
  variant="primary"
  size="md"
  leftIcon={<PlusIcon className="w-4 h-4" />}
  onClick={handleClick}
>
  Add Item
</Button>
```

### 2. Input
**Location**: `components/common/Input.tsx`

**Props**:
```typescript
interface InputProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}
```

### 3. ChatMessage
**Location**: `components/chat/ChatMessage.tsx`

**Props**:
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  className?: string;
}
```

## Page Layouts

### 1. Dashboard Layout
**Location**: `components/layouts/DashboardLayout.tsx`

**Structure**:
```
┌─────────────────────────────────────┐
│  Header                            │
├────────────────┬───────────────────┤
│  Sidebar      │  Main Content     │
│  - Nav Items  │                   │
│  - User Menu  │                   │
└────────────────┴───────────────────┘
```

## Form Components

### 1. LoginForm
**Location**: `components/forms/LoginForm.tsx`

**Fields**:
- Email
- Password
- Remember me
- Forgot password link
- Submit button

## Hooks

### 1. useAuth
**Location**: `hooks/useAuth.ts`

**Methods**:
- `login(email, password)`
- `logout()`
- `register(userData)`
- `user`: Current user object
- `isLoading`: Auth state loading
- `error`: Auth error if any

## Styling Guidelines

### 1. Tailwind CSS
- Use Tailwind utility classes directly in components
- Custom colors and spacing should be added to `tailwind.config.js`
- Use `@apply` only for repeated component styles

### 2. Responsive Design
- Mobile-first approach
- Use responsive prefixes (sm:, md:, lg:)
- Test on all breakpoints

### 3. Dark Mode
- Use `dark:` prefix for dark mode styles
- Toggle with `useTheme` hook

## Best Practices
1. **Component Composition**: Compose smaller components to build complex UIs
2. **Props Naming**: Use clear, descriptive prop names
3. **Type Safety**: Always define TypeScript interfaces for props
4. **Accessibility**:
   - Use semantic HTML
   - Add ARIA labels where needed
   - Ensure keyboard navigation works
5. **Performance**:
   - Memoize expensive components
   - Use dynamic imports for large components
   - Optimize images

## Icons
- Use `@heroicons/react` for icons
- Icon size should match text size (e.g., `h-5 w-5` for base text)
- Always include `aria-hidden="true"` for decorative icons

## Animation
- Use Framer Motion for complex animations
- Keep animations subtle and purposeful
- Respect `prefers-reduced-motion`

## Testing
- Use `@testing-library/react` for unit tests
- Test component rendering and interactions
- Mock API calls in tests
