import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow Pro - Deterministic DAG Kanban & Critical Path Engine',
  description: 'Kanban board powered by pure DAG graph calculations, cycle detection, and CPM scheduling.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
