'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrintJob } from '@/lib/api';
import { JobRow } from './job-row';

const PAGE_SIZE = 4;

export function JobsCard({
  jobs,
  query,
  setQuery,
}: {
  jobs: PrintJob[];
  query: string;
  setQuery: (value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return jobs.slice(start, start + PAGE_SIZE);
  }, [jobs, page]);
  const firstJobNumber = jobs.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastJobNumber = Math.min(page * PAGE_SIZE, jobs.length);

  useEffect(() => {
    setPage(1);
  }, [query, jobs.length]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Print Queue</CardTitle>
          <CardDescription>{jobs.length} jobs from backend</CardDescription>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs..." className="pl-9" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {jobs.length ? (
          <>
            {visibleJobs.map((job) => <JobRow key={job._id} job={job} selected={false} onSelect={() => undefined} />)}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-secondary">
                Showing {firstJobNumber}-{lastJobNumber} of {jobs.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="min-w-16 text-center text-xs font-semibold text-secondary">
                  {page} / {pageCount}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page === pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState text="No print jobs yet. Customer jobs will appear here after upload." />
        )}
      </CardContent>
    </Card>
  );
}
