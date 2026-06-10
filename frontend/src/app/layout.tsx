import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Lumina — A Safe Space for Emotional Well-Being',
  description: 'A calming, supportive, and empathetic AI first responder for emotional support and evidence-based coping strategies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}