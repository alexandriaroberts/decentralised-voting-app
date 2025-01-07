import { Metadata } from 'next';
import VotingApp from '@/components/VotingApp';

export const metadata: Metadata = {
  title: 'Decentralized Voting DApp',
  description:
    'A decentralized voting application built with Next.js and Ethereum',
};

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-gray-800'>
      <h1 className='text-4xl font-bold mb-8 text-white'>
        Decentralized Voting
      </h1>
      <VotingApp />
    </main>
  );
}
