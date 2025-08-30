"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, EventDropArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { formatDate } from '@fullcalendar/core';
import { fetchEvents, createEvent, updateEvent, deleteEvent, type CalendarEventDTO, createEventsFromIntent } from '@/features/calendar/api';
import { parseQuickWhen } from '@/features/calendar/utils/quickWhen';
import { QuickAddModal } from '@/features/calendar/components/QuickAddModal';
import { EditEventModal } from '@/features/calendar/components/EditEventModal';

// Styles are loaded globally via globals.css (@import from CDN)

export default function CalendarView() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const calendarRef = useRef<FullCalendar | null>(null);
  const lastViewRef = useRef<string | null>(null);
  const justResetRef = useRef<boolean>(false);
  // Quick add modal state
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddInfo, setQuickAddInfo] = useState<DateSelectArg | null>(null);
  const [quickAddAt, setQuickAddAt] = useState<Date | null>(null);
  // Edit modal state
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  // UI state
  const [query, setQuery] = useState<string>('');

  const refetchEvents = useCallback(async () => {
    try {
      const list = await fetchEvents();
      setEvents(list.map(mapDtoToEvent));
      setBackendAvailable(true);
    } catch (err: any) {
      if (err?.status === 503) {
        setBackendAvailable(false);
      } else {
        setBackendAvailable(false);
      }
    }
  }, []);

  // When switching between views (e.g., month -> day -> month), always jump back to 'today'
  const handleDatesSet = useCallback((arg: any) => {
    const type: string = arg?.view?.type ?? '';
    const api: any = (calendarRef.current as any)?.getApi?.() ?? null;
    if (!type || !api) return;

    // If view type changed since last render
    if (lastViewRef.current && type !== lastViewRef.current) {
      if (!justResetRef.current) {
        // trigger a one-time reset to today on view change
        justResetRef.current = true;
        api.today();
        return; // wait for next datesSet
      }
    }

    // finalize state after potential reset
    lastViewRef.current = type;
    if (justResetRef.current) justResetRef.current = false;
  }, []);

  // Helper to convert DTOs to FullCalendar EventInput
  const mapDtoToEvent = (e: CalendarEventDTO): EventInput => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end || undefined,
    allDay: e.all_day,
    extendedProps: { description: e.description ?? undefined },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchEvents();
        if (!mounted) return;
        setEvents(list.map(mapDtoToEvent));
        setBackendAvailable(true);
      } catch (err: any) {
        // 503 means migrations missing; fall back to local demo event
        if (err?.status === 503) {
          setBackendAvailable(false);
          setEvents([{ id: 'init-1', title: 'Welcome to your planner', start: new Date() }]);
        } else {
          // Network or auth error; keep empty but don't crash
          setBackendAvailable(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    // Listen for chat-triggered refreshes
    const onRefresh = () => { void refetchEvents(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('calendar:refresh', onRefresh as EventListener);
    }
    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('calendar:refresh', onRefresh as EventListener);
      }
    };
  }, [refetchEvents]);

  const headerToolbar = useMemo(
    () => ({
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    }),
    []
  );

  // Pretty event renderer to avoid awkward duplicates like "8:05p lunch also"
  const renderEvent = useCallback((arg: any) => {
    const isAllDay = arg.event.allDay;
    const start = arg.event.start as Date | null;
    const timeStr = !isAllDay && start
      ? formatDate(start, { hour: 'numeric', minute: '2-digit', meridiem: 'short' })
      : '';
    const title = arg.event.title || '';
    const desc = (arg.event.extendedProps?.description as string | undefined) || '';
    return (
      <div className="flex items-start gap-1.5 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 overflow-hidden">
        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!isAllDay && timeStr && (
              <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-200 whitespace-nowrap">{timeStr}</span>
            )}
            <span className="text-[12px] font-semibold truncate">{title}</span>
          </div>
          {desc && <div className="text-[11px] text-indigo-700/80 dark:text-indigo-200/80 truncate">{desc}</div>}
        </div>
      </div>
    );
  }, []);

  // Keyboard shortcuts: t (today), n/p (next/prev), q (quick add)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      // Do not trigger global shortcuts when a modal is open
      if (quickAddOpen || editOpen) return;
      const api = (calendarRef.current as any)?.getApi?.();
      if (!api) return;
      if (e.key === 't') { api.today(); }
      if (e.key === 'n') { api.next(); }
      if (e.key === 'p') { api.prev(); }
      if (e.key.toLowerCase() === 'q') {
        setQuickAddAt(new Date());
        setQuickAddInfo(null);
        setQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDateSelect = useCallback(async (selectInfo: DateSelectArg) => {
    // Open Quick Add modal; unselect to clear highlight
    selectInfo.view.calendar.unselect();
    setQuickAddInfo(selectInfo);
    setQuickAddOpen(true);
  }, []);

  const handleEventClick = useCallback(async (clickInfo: EventClickArg) => {
    const target = clickInfo.event;
    setEditEventId(target.id);
    setEditTitle(target.title ?? '');
    setEditOpen(true);
  }, []);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const { event } = arg;
    const prevSnapshot = events;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: event.start ?? undefined, end: event.end ?? undefined, allDay: event.allDay ?? false }
          : e
      )
    );
    if (!backendAvailable) return;
    try {
      await updateEvent(event.id, {
        start: event.start ? event.start.toISOString() : undefined,
        end: event.end ? event.end.toISOString() : undefined,
        all_day: !!event.allDay,
      });
    } catch (err) {
      setEvents(prevSnapshot);
      setBackendAvailable(false);
      console.warn('Drag/move failed; reverting locally.', err);
    }
  }, [backendAvailable, events]);

  const handleEventResize = useCallback(async (arg: EventResizeDoneArg) => {
    const { event } = arg;
    const prevSnapshot = events;
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, start: event.start ?? undefined, end: event.end ?? undefined } : e))
    );
    if (!backendAvailable) return;
    try {
      await updateEvent(event.id, {
        start: event.start ? event.start.toISOString() : undefined,
        end: event.end ? event.end.toISOString() : undefined,
      });
    } catch (err) {
      setEvents(prevSnapshot);
      setBackendAvailable(false);
      console.warn('Resize failed; reverting locally.', err);
    }
  }, [backendAvailable, events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => (e.title ?? '').toLowerCase().includes(q));
  }, [events, query]);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Build a helpful prompt with the currently visible range (if accessible)
  const prompt = useMemo(() => {
    try {
      const api: any = (calendarRef.current as any)?.getApi?.();
      const view = api?.view;
      const start = view?.currentStart as Date | undefined;
      const end = view?.currentEnd as Date | undefined;
      if (start && end) {
        const s = start.toISOString().slice(0, 10);
        const e = end.toISOString().slice(0, 10);
        return `Help me plan my schedule for ${s} to ${e}.`;
      }
    } catch { /* noop */ }
    return 'Help me plan my schedule for this period.';
  }, [lastViewRef.current]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 shadow dark:shadow-none border border-gray-200 dark:border-zinc-800">
      {/* Top bar: search + timezone + shortcut hint */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events (title)..."
            className="w-full sm:w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search events"
          />
          <button
            type="button"
            onClick={() => { setQuickAddAt(new Date()); setQuickAddInfo(null); setQuickAddOpen(true); }}
            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            New event (Q)
          </button>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <span className="hidden sm:inline">Timezone:</span>
          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">{tz}</span>
          <span className="hidden sm:inline">Shortcuts: T=Today, N/P=Next/Prev, Q=Quick add</span>
          <Link
            href={`/companion?prompt=${encodeURIComponent(prompt)}`}
            className="ml-auto sm:ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            title="Open chat with context"
          >
            Ask Assistant
          </Link>
        </div>
      </div>
      {loading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Loading events…</div>
      )}
      {!loading && !backendAvailable && (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded px-2 py-1 mb-2">
          Calendar backend not available (database migration likely pending). Working in local-only mode.
        </div>
      )}
      {!loading && backendAvailable && filteredEvents.length === 0 && (
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
          <span>No events match your search.</span>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Clear search
          </button>
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        headerToolbar={headerToolbar}
        initialView="dayGridMonth"
        weekends={true}
        selectable={true}
        selectMirror={true}
        editable={true}
        droppable={false}
        nowIndicator={true}
        dayMaxEvents={true}
        events={filteredEvents}
        eventContent={renderEvent as any}
        datesSet={handleDatesSet as any}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        ref={calendarRef as any}
        height="auto"
      />
      {/* Quick Add Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => { setQuickAddOpen(false); setQuickAddInfo(null); }}
        onCreate={async ({ title, durationMinutes, description, whenText }) => {
          const info = quickAddInfo;
          setQuickAddOpen(false);
          const baseStart = info?.start ?? quickAddAt ?? new Date();
          let useAllDay = info ? !!info.allDay : false;
          if (!baseStart) return;

          const wantBackendIntent = backendAvailable && !!whenText && whenText.trim().length > 0;
          if (wantBackendIntent) {
            try {
              const resp = await createEventsFromIntent({
                text: whenText!.trim(),
                default_duration_minutes: durationMinutes,
                persist: true,
                description: description ?? undefined,
              });
              const first = resp.items?.[0];
              const start = first ? new Date(first.start) : baseStart;
              const end = first?.end ? new Date(first.end) : (useAllDay
                ? (info?.end ?? new Date(start.getTime() + 24 * 60 * 60 * 1000))
                : new Date(start.getTime() + durationMinutes * 60 * 1000));
              if (first) useAllDay = first.all_day as any ?? first.all_day; // types differ between dto/intents
              const tempId = `tmp-${Date.now()}`;
              const optimistic: EventInput = {
                id: tempId,
                title: first?.title ?? title,
                start,
                end,
                allDay: first ? first.all_day : useAllDay,
                extendedProps: { description: first?.description ?? description },
              } as any;
              setEvents((prev) => [...prev, optimistic]);
              // If persisted, refetch to get authoritative DTOs
              if (resp.persisted_event_ids && resp.persisted_event_ids.length > 0) {
                await refetchEvents();
                setEvents((prev) => prev.filter((e) => e.id !== tempId));
              }
            } catch (err) {
              // Fallback to client-side parsing + normal create
              try {
                const parsed = parseQuickWhen(whenText, durationMinutes);
                const start = parsed?.start ?? baseStart;
                const end = parsed?.end ?? (useAllDay
                  ? (info?.end ?? new Date(start.getTime() + 24 * 60 * 60 * 1000))
                  : new Date(start.getTime() + durationMinutes * 60 * 1000));
                if (parsed) useAllDay = parsed.allDay;
                const tempId = `tmp-${Date.now()}`;
                const optimistic: EventInput = {
                  id: tempId,
                  title,
                  start,
                  end,
                  allDay: useAllDay,
                  extendedProps: { description },
                };
                setEvents((prev) => [...prev, optimistic]);
                if (backendAvailable) {
                  const created = await createEvent({
                    title,
                    start: start.toISOString(),
                    end: end ? end.toISOString() : undefined,
                    all_day: useAllDay,
                    description,
                  } as any);
                  setEvents((prev) => prev.map((e) => (e.id === tempId ? mapDtoToEvent(created) : e)));
                }
              } catch (inner) {
                setBackendAvailable(false);
                console.warn('Quick Add fallback failed.', inner);
              }
            } finally {
              setQuickAddInfo(null);
              setQuickAddAt(null);
            }
            return;
          }

          // No backend intent available: use client parser and create
          try {
            const parsed = parseQuickWhen(whenText, durationMinutes);
            const start = parsed?.start ?? baseStart;
            const end = parsed?.end ?? (useAllDay
              ? (info?.end ?? new Date(start.getTime() + 24 * 60 * 60 * 1000))
              : new Date(start.getTime() + durationMinutes * 60 * 1000));
            if (parsed) useAllDay = parsed.allDay;
            const tempId = `tmp-${Date.now()}`;
            const optimistic: EventInput = {
              id: tempId,
              title,
              start,
              end,
              allDay: useAllDay,
              extendedProps: { description },
            };
            setEvents((prev) => [...prev, optimistic]);
            if (backendAvailable) {
              const created = await createEvent({
                title,
                start: start.toISOString(),
                end: end ? end.toISOString() : undefined,
                all_day: useAllDay,
                description,
              } as any);
              setEvents((prev) => prev.map((e) => (e.id === tempId ? mapDtoToEvent(created) : e)));
            }
          } catch (err) {
            setBackendAvailable(false);
            console.warn('Create event failed; using local-only state.', err);
          } finally {
            setQuickAddInfo(null);
            setQuickAddAt(null);
          }
        }}
      />
      {/* Edit Event Modal */}
      <EditEventModal
        open={editOpen}
        title={editTitle}
        description={(events.find((e) => e.id === editEventId)?.extendedProps as any)?.description}
        onClose={() => { setEditOpen(false); setEditEventId(null); }}
        onUpdate={async ({ title, description }) => {
          const id = editEventId;
          setEditOpen(false);
          if (!id) return;
          const prevSnapshot = events;
          setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, title, extendedProps: { ...(e as any).extendedProps, description } } : e)));
          if (!backendAvailable) return;
          try {
            await updateEvent(id, { title, description });
          } catch (err) {
            setEvents(prevSnapshot);
            setBackendAvailable(false);
            // eslint-disable-next-line no-console
            console.warn('Update failed; reverting locally.', err);
          } finally {
            setEditEventId(null);
          }
        }}
        onDelete={async () => {
          const id = editEventId;
          setEditOpen(false);
          if (!id) return;
          const prevSnapshot = events;
          setEvents((prev) => prev.filter((e) => e.id !== id));
          if (!backendAvailable) return;
          try {
            await deleteEvent(id);
          } catch (err) {
            setEvents(prevSnapshot);
            setBackendAvailable(false);
            // eslint-disable-next-line no-console
            console.warn('Delete failed; reverting locally.', err);
          } finally {
            setEditEventId(null);
          }
        }}
      />
    </div>
  );
}
