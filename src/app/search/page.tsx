import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import * as searchService from '../../service/search.service';
import SearchResults from '../../components/SearchResults';

export const metadata = {
  title: 'Search Results - JD CRM',
  description: 'Search results for orders and customers',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const { q } = await searchParams;

  const results = q ? await searchService.search(q) : { orders: [], customers: [] };

  return (
    <div className="agents-page-container">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Search Results</h1>
          <p className="page-subtitle">
            {q ? `Showing matches for "${q}"` : 'Please enter a search query'}
          </p>
        </div>
      </div>
      <SearchResults results={results} />
    </div>
  );
}
