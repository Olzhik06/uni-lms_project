'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CalendarData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage, useT } from '@/lib/i18n';

const LOCALES = {
  en: 'en-US',
  ru: 'ru-RU',
  kz: 'kk-KZ',
} as const;

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const t = useT();
  const { lang } = useLanguage();
  const locale = LOCALES[lang];
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const { data, isLoading } = useQuery<CalendarData>({
    queryKey: ['cal', monthKey],
    queryFn: () => api.get(`/me/calendar?month=${monthKey}`),
  });

  const prev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const next = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const cells: Array<number | null> = [];
  for (let index = 0; index < startWeekday; index += 1) cells.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = useMemo(() => (
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2026, 0, 5 + index);
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    })
  ), [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));

  const eventsForDay = (day: number) => {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      scheduleItems: (data?.scheduleItems || []).filter(item => item.startsAt.slice(0, 10) === dateString),
      assignments: (data?.assignments || []).filter(item => item.dueAt.slice(0, 10) === dateString),
    };
  };

  const isToday = (day: number) => (
    day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
  );

  const hasAnyEvents = (data?.scheduleItems?.length || 0) + (data?.assignments?.length || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.calendar.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{monthLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev} title={t.calendar.previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); }}>
            {t.schedule.today}
          </Button>
          <Button variant="outline" size="icon" onClick={next} title={t.calendar.nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-[520px] w-full" />
            </div>
          ) : !hasAnyEvents ? (
            <div className="py-16 text-center text-muted-foreground">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">{t.calendar.noEvents}</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-7 border-b">
                {weekdays.map(day => (
                  <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-7">
                {cells.map((day, index) => {
                  const dayEvents = day ? eventsForDay(day) : { scheduleItems: [], assignments: [] };
                  const extraCount = Math.max(dayEvents.scheduleItems.length + dayEvents.assignments.length - 3, 0);

                  return (
                    <div
                      key={`${monthKey}-${index}`}
                      className={`min-h-[120px] border-b p-2 sm:border-r ${!day ? 'bg-muted/30' : ''} ${day && isToday(day) ? 'bg-primary/5' : ''}`}
                    >
                      {!day ? null : (
                        <>
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday(day) ? 'bg-primary font-bold text-white' : 'text-muted-foreground'}`}>
                            {day}
                          </span>

                          {dayEvents.scheduleItems.length === 0 && dayEvents.assignments.length === 0 ? (
                            <p className="mt-3 text-[11px] text-muted-foreground">{t.calendar.noItemsForDay}</p>
                          ) : (
                            <div className="mt-2 space-y-1">
                              {dayEvents.scheduleItems.slice(0, 2).map(item => (
                                <div key={item.id} className="rounded bg-blue-100 px-1.5 py-1 text-[10px] text-blue-700">
                                  <span className="font-medium">{t.calendar.classes}:</span> {item.course?.code}
                                </div>
                              ))}
                              {dayEvents.assignments.slice(0, 1).map(item => (
                                <div key={item.id} className="rounded bg-red-100 px-1.5 py-1 text-[10px] text-red-700">
                                  <span className="font-medium">{t.calendar.due}:</span> {item.title}
                                </div>
                              ))}
                              {extraCount > 0 && (
                                <Badge variant="outline" className="mt-1 text-[10px]">
                                  +{extraCount} {t.calendar.moreItems}
                                </Badge>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
