import ClientLayout from './client-layout';
import './globals.css';

export const metadata = {
  title: 'HealthLog AI',
  description: 'AI-powered health and fitness tracking companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
