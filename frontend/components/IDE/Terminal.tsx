'use client';

import dynamic from 'next/dynamic';

const TerminalComponent = dynamic(
  () => import('./TerminalPanel'),
  { ssr: false, loading: () => <div className="h-full bg-[#0f0f1a] flex items-center justify-center text-gray-500 text-sm">Loading terminal...</div> }
);

export default function TerminalDynamic(props) {
  return <TerminalComponent {...props} />;
}
