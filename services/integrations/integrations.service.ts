import { deleteData, getData, postData } from "@/services/api/client";
import type {
  ConnectResponse,
  ConnectedAccount,
  HealthCheckResponse,
  HealthReport,
  Integration,
  IntegrationProviderInfo,
  IntegrationsDashboard,
  LeadForm,
  SyncJob,
} from "@/types";

export const integrationsService = {
  getProviders(): Promise<{ providers: IntegrationProviderInfo[] }> {
    return getData<{ providers: IntegrationProviderInfo[] }>("/integrations/providers");
  },

  connect(
    provider: string,
    returnUrl?: string,
  ): Promise<ConnectResponse> {
    return postData<ConnectResponse>("/integrations/connect", {
      provider,
      returnUrl: returnUrl ?? `${window.location.origin}/integrations`,
    });
  },

  list(): Promise<{ integrations: Integration[] }> {
    return getData<{ integrations: Integration[] }>("/integrations");
  },

  get(id: string): Promise<Integration> {
    return getData<Integration>(`/integrations/${id}`);
  },

  discoverAccounts(id: string): Promise<{ accounts: ConnectedAccount[] }> {
    return postData<{ accounts: ConnectedAccount[] }>(`/integrations/${id}/discover-accounts`);
  },

  selectAccounts(
    id: string,
    accountIds: string[],
  ): Promise<{ selected: string[] }> {
    return postData<{ selected: string[] }>(`/integrations/${id}/select-accounts`, {
      accountIds,
    });
  },

  discoverForms(
    id: string,
    connectedAccountId: string,
  ): Promise<{ forms: LeadForm[] }> {
    return postData<{ forms: LeadForm[] }>(`/integrations/${id}/discover-forms`, {
      connectedAccountId,
    });
  },

  health(id: string): Promise<HealthCheckResponse> {
    return getData<HealthCheckResponse>(`/integrations/${id}/health`);
  },

  healthReport(id: string): Promise<HealthReport> {
    return getData<HealthReport>(`/integrations/${id}/health-report`);
  },

  dashboard(): Promise<IntegrationsDashboard> {
    return getData<IntegrationsDashboard>("/integrations/dashboard");
  },

  syncJobs(id: string): Promise<{ jobs: SyncJob[] }> {
    return getData<{ jobs: SyncJob[] }>(`/integrations/${id}/sync-jobs`);
  },

  triggerSync(id: string): Promise<{ triggered: boolean }> {
    return postData<{ triggered: boolean }>(`/integrations/${id}/trigger-sync`);
  },

  replayWebhookEvent(
    id: string,
    eventId: string,
  ): Promise<{ replayed: boolean }> {
    return postData<{ replayed: boolean }>(
      `/integrations/${id}/webhook-events/${eventId}/replay`,
    );
  },

  disconnect(id: string): Promise<{ disconnected: boolean }> {
    return deleteData<{ disconnected: boolean }>(`/integrations/${id}`);
  },
};
