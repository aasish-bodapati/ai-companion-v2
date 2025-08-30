import api from '@/lib/api';

export type CalendarEventDTO = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start: string; // ISO string
  end?: string | null; // ISO string
  all_day: boolean;
  created_at: string;
  updated_at: string;
};

export type CalendarEventCreateDTO = {
  title: string;
  description?: string | null;
  start: string; // ISO
  end?: string | null; // ISO
  all_day?: boolean;
};

export type CalendarEventUpdateDTO = Partial<CalendarEventCreateDTO>;

export async function fetchEvents(params?: { start?: string; end?: string }): Promise<CalendarEventDTO[]> {
  return api.get<CalendarEventDTO[]>('/calendar/events', params);
}

export async function createEvent(body: CalendarEventCreateDTO): Promise<CalendarEventDTO> {
  return api.post<CalendarEventDTO>('/calendar/events', body);
}

export async function updateEvent(id: string, body: CalendarEventUpdateDTO): Promise<CalendarEventDTO> {
  return api.patch<CalendarEventDTO>(`/calendar/events/${id}`, body);
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete<void>(`/calendar/events/${id}`);
}

export type CalendarEventBulkItem = {
  title: string;
  start: string;
  end?: string | null;
  description?: string | null;
  all_day?: boolean;
};

export async function createEventsBulk(items: CalendarEventBulkItem[]): Promise<CalendarEventDTO[]> {
  return api.post<CalendarEventDTO[]>(`/calendar/events/bulk`, { events: items });
}

// Intent-based NL endpoint
export type CalendarIntentRequest = {
  text: string;
  default_duration_minutes?: number;
  persist?: boolean;
  description?: string | null;
  timezone_hint?: string | null;
};

export type CalendarIntentNormalized = {
  title: string;
  start: string; // ISO
  end?: string | null; // ISO
  all_day: boolean;
  description?: string | null;
};

export type CalendarIntentResponse = {
  items: CalendarIntentNormalized[];
  persisted_event_ids?: string[] | null;
};

export async function createEventsFromIntent(req: CalendarIntentRequest): Promise<CalendarIntentResponse> {
  return api.post<CalendarIntentResponse>('/calendar/intents', req);
}
