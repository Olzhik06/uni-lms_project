'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchResults } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, FileText, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length >= 2,
  });

  const total = (data?.courses.length || 0) + (data?.materials.length || 0) + (data?.assignments.length || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground text-sm">Search across courses, materials and assignments</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search courses, materials, assignments..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {debouncedQuery.length < 2 && (
        <p className="text-sm text-muted-foreground text-center py-8">Type at least 2 characters to search</p>
      )}

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg"/>)}</div>
      )}

      {data && !isLoading && (
        <>
          <p className="text-sm text-muted-foreground">{total} result{total !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;</p>

          {data.courses.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4"/>Courses</h2>
              {data.courses.map(c => (
                <Link key={c.id} href={`/courses/${c.id}/overview`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                      </div>
                      <Badge variant="secondary">{c.code}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {data.materials.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/>Materials</h2>
              {data.materials.map(m => (
                <Link key={m.id} href={`/courses/${m.courseId}/materials`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.course?.code} · {m.course?.title}</p>
                      </div>
                      <Badge variant="outline">{m.type}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {data.assignments.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Assignments</h2>
              {data.assignments.map(a => (
                <Link key={a.id} href={`/courses/${a.courseId}/assignments`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.course?.code} · Due {formatDate(a.dueAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {total === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results found for &quot;{debouncedQuery}&quot;</p>
          )}
        </>
      )}
    </div>
  );
}
