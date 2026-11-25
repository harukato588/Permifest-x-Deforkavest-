export interface MfaSetupResult {
  success: boolean;
  message?: string;
  data?: {
    factorId: string;
    setupRequired: boolean;
    qrCode?: string;
    secret?: string;
  };
}
