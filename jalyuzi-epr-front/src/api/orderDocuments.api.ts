import api from './axios';

export type DocumentType = 'invoice' | 'act' | 'warranty';

const FILE_LABELS: Record<DocumentType, string> = {
  invoice: 'faktura',
  act: 'akt',
  warranty: 'garantiya',
};

export const orderDocumentsApi = {
  /**
   * Buyurtma uchun PDF yuklab olish (browser'da download dialog ochiladi).
   */
  download: async (orderId: number, type: DocumentType): Promise<void> => {
    const response = await api.get(`/v1/orders/${orderId}/documents/${type}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${FILE_LABELS[type]}-${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
