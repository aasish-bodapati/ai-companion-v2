# AI Companion Frontend

Next.js 14 frontend for the AI Companion application, providing an intuitive interface for AI-powered conversations, memory management, and life improvement features.

## 🏗️ Architecture

### Core Technologies
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management
- **Playwright**: End-to-end testing

### Directory Structure
```
frontend/
├── src/                    # Source code
│   ├── app/              # App Router pages and layouts
│   │   ├── chat/         # Chat interface
│   │   ├── memories/     # Memory management
│   │   ├── today/        # Daily dashboard
│   │   ├── goals/        # Goal tracking
│   │   ├── calendar/     # Calendar integration
│   │   └── profile/      # User profile
│   ├── components/       # Reusable React components
│   │   ├── ui/          # Base UI components
│   │   ├── forms/       # Form components
│   │   └── layout/      # Layout components
│   ├── services/         # API service layer
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── lib/              # Third-party library configs
│   └── contexts/         # React context providers
├── public/                # Static assets
├── tests/                 # Test suite
├── package.json           # Dependencies and scripts
└── tailwind.config.js     # Tailwind configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to http://localhost:3000

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics and monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Tailwind Configuration

The project uses Tailwind CSS with custom configuration in `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

## 🧪 Testing

### Run all tests
```bash
npm run test:all
```

### Unit tests only
```bash
npm run test:unit
```

### Integration tests only
```bash
npm run test:integration
```

### End-to-end tests
```bash
npm run test:e2e
```

### Test with coverage
```bash
npm run test:coverage
```

## 🎨 Styling

### Tailwind CSS
The project uses Tailwind CSS for styling with custom components:

```tsx
import { Button } from '@/components/ui/button'

export function MyComponent() {
  return (
    <Button variant="primary" size="lg">
      Click me
    </Button>
  )
}
```

### CSS Modules
For component-specific styles, use CSS modules:

```tsx
import styles from './MyComponent.module.css'

export function MyComponent() {
  return <div className={styles.container}>Content</div>
}
```

## 📱 Responsive Design

The application is built with mobile-first responsive design:

- **Mobile**: Optimized for small screens
- **Tablet**: Adaptive layouts for medium screens
- **Desktop**: Full-featured desktop experience

## 🔌 API Integration

### Service Layer
API calls are organized in the `src/services/` directory:

```tsx
import { apiClient } from '@/services/api-client'

export const conversationService = {
  async getConversations() {
    return apiClient.get('/api/v1/conversations')
  },
  
  async sendMessage(conversationId: string, message: string) {
    return apiClient.post(`/api/v1/conversations/${conversationId}/messages`, {
      content: message
    })
  }
}
```

### React Query Integration
Server state is managed with React Query:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { conversationService } from '@/services/conversation'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationService.getConversations
  })
}
```

## 🚀 Development

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (via ESLint)

### Adding New Pages

1. Create page directory in `src/app/`
2. Add `page.tsx` for the route
3. Include in navigation if needed
4. Add tests in `tests/` directory

### Adding New Components

1. Create component file in `src/components/`
2. Export component with proper TypeScript types
3. Add to component index if needed
4. Include tests and documentation

## 📊 Performance

### Optimization Features
- **Next.js Image**: Optimized image loading
- **Dynamic Imports**: Code splitting for better performance
- **React Query**: Efficient data fetching and caching
- **Tailwind JIT**: Optimized CSS generation

### Bundle Analysis
```bash
npm run build
npm run analyze
```

## 🔍 Debugging

### Development Tools
- **React DevTools**: Component inspection
- **Next.js DevTools**: Framework-specific debugging
- **Browser DevTools**: Network and performance analysis

### Error Boundaries
The app includes error boundaries for graceful error handling:

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function Layout({ children }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundary>
  )
}
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Query Documentation](https://tanstack.com/query/latest)
