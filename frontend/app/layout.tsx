import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'FreeCode AI - AI-Powered Code Editor',
  description: 'Code, create, and collaborate with AI assistance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e2e8f0',
              border: '1px solid #2a2a4a',
            },
          }}
        />
      </body>
    </html>
  );
}
