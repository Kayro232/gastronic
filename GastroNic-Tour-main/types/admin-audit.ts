export interface AuditActor {
  id: string;
  full_name: string;
  username: string | null;
}

export interface AuditLogItem {
  id: number;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;

  old_data:
    | Record<string, unknown>
    | null;

  new_data:
    | Record<string, unknown>
    | null;

  created_at: string;

  actor:
    | AuditActor
    | null;
}