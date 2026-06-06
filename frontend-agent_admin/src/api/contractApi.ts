import apiClient from '@/lib/api-client';

export interface ContractPaymentRequest {
  amount: number;
  dueDate: string;
  paymentOrder: number;
}

export interface CreateContractRequest {
  agreedPrice: number;
  depositAmount: number;
  depositDate?: string | null;
  keyHandoverDate?: string | null;
  internalNotes?: string;
  payments: ContractPaymentRequest[];
}

/** Créer un contrat (avec son calendrier de paiement) */
export async function createContract(dealId: string, body: CreateContractRequest) {
  const res = await apiClient.post(`/api/contracts?dealId=${dealId}`, body);
  return res.data;
}

/** Récupérer tous les contrats d'un deal */
export async function getContractsByDeal(dealId: string) {
  const res = await apiClient.get(`/api/contracts/deal/${dealId}`);
  return res.data;
}

/** Récupérer un contrat par ID */
export async function getContractById(contractId: string) {
  const res = await apiClient.get(`/api/contracts/${contractId}`);
  return res.data;
}

/** Changer le statut d'un contrat */
export async function updateContractStatus(contractId: string, status: string) {
  const res = await apiClient.patch(`/api/contracts/${contractId}/status`, { status });
  return res.data;
}

/** Supprimer un contrat (uniquement si DRAFT) */
export async function deleteContract(contractId: string) {
  await apiClient.delete(`/api/contracts/${contractId}`);
  return true;
}

/** Marquer un paiement comme payé */
export async function markPaymentPaid(contractId: string, paymentId: string) {
  const res = await apiClient.patch(`/api/contracts/${contractId}/payments/${paymentId}/paid`);
  return res.data;
}

/** Analyser les risques d'un brouillon de contrat */
export async function analyzeContract(contractId: string): Promise<{ analysis: string }> {
  const res = await apiClient.post(`/api/contracts/${contractId}/analyze`);
  return res.data;
}
