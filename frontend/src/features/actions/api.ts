import api from '@/lib/api';

export type ActionParam = {
  name: string;
  required?: boolean;
  schema?: any; // JSON Schema for the parameter
  description?: string;
};

export type ActionDescriptor = {
  name: string; // e.g., "journal.add_entry"
  title?: string;
  description?: string;
  params?: ActionParam[];
  result_schema?: any;
  permissions?: string[];
  category?: string;
  // risk tier from backend registry: low | medium | high
  risk?: 'low' | 'medium' | 'high';
};

export type ActionsDiscoveryResponse = {
  actions: ActionDescriptor[];
};

export type ExecuteActionRequest = {
  action: string;
  params?: Record<string, any>;
  client_action_id?: string;
};

export type ExecuteActionSuccess = {
  ok: true;
  action: string;
  result?: any;
  id?: string;
};

export type ExecuteActionError = {
  ok: false;
  action: string;
  error: string;
  code?: string;
};

export type ExecuteActionResponse = ExecuteActionSuccess | ExecuteActionError;

export async function listActions(): Promise<ActionsDiscoveryResponse> {
  return api.get<ActionsDiscoveryResponse>('/actions');
}

export async function executeAction(body: ExecuteActionRequest): Promise<ExecuteActionResponse> {
  return api.post<ExecuteActionResponse>('/actions/execute', body);
}

export type UndoActionRequest = { undo_token: string };
export type UndoActionSuccess = { ok: true; action: string; result?: any };
export type UndoActionError = { ok: false; action: string; error: string; code?: string };
export type UndoActionResponse = UndoActionSuccess | UndoActionError;

export async function undoAction(body: UndoActionRequest): Promise<UndoActionResponse> {
  return api.post<UndoActionResponse>('/actions/undo', body);
}

export default { listActions, executeAction, undoAction };
