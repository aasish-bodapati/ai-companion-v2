import api from '@/lib/api';

// Types follow docs/ground_truth/33_actions_registry.md and 34_coaching_api_contracts.md
export type ExecuteActionRequest = {
  action: string; // e.g., "hydration.log_water"
  params?: Record<string, any>;
  client_action_id?: string;
};

export type ExecuteActionSuccess = {
  ok: true;
  action: string;
  result?: any;
  id?: string; // optional created id
};

export type ExecuteActionError = {
  ok: false;
  action: string;
  error: string;
  code?: string;
};

export type ExecuteActionResponse = ExecuteActionSuccess | ExecuteActionError;

export async function executeAction(body: ExecuteActionRequest): Promise<ExecuteActionResponse> {
  return api.post<ExecuteActionResponse>('/actions/execute', body);
}

export default { executeAction };
