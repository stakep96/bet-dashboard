import { useState, useEffect, useCallback } from 'react';
import { Entrada } from '@/contexts/BancaContext';

const WEBHOOK_STORAGE_KEY = 'zapier-webhook-url';
const WEBHOOK_ENABLED_KEY = 'zapier-webhook-enabled';

export function useZapierWebhook() {
  const [webhookUrl, setWebhookUrlState] = useState<string>('');
  const [isEnabled, setIsEnabledState] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    const savedEnabled = localStorage.getItem(WEBHOOK_ENABLED_KEY);
    
    if (savedUrl) setWebhookUrlState(savedUrl);
    if (savedEnabled) setIsEnabledState(savedEnabled === 'true');
  }, []);

  const setWebhookUrl = useCallback((url: string) => {
    setWebhookUrlState(url);
    localStorage.setItem(WEBHOOK_STORAGE_KEY, url);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    localStorage.setItem(WEBHOOK_ENABLED_KEY, String(enabled));
  }, []);

  const sendToWebhook = useCallback(async (entradas: Entrada[], bancaName: string): Promise<boolean> => {
    if (!isEnabled || !webhookUrl) {
      return false;
    }

    setIsSending(true);

    try {
      // Format entries for Google Sheets compatibility
      const formattedEntries = entradas.map(e => ({
        data: e.data,
        dataEvento: e.dataEvento,
        modalidade: e.modalidade,
        evento: e.evento,
        mercado: e.mercado,
        entrada: e.entrada,
        odd: e.odd,
        stake: e.stake,
        resultado: e.resultado,
        lucro: e.lucro,
        timing: e.timing,
        site: e.site,
        banca: bancaName,
        createdAt: new Date().toISOString(),
      }));

      // For single entries, send as object; for multiple, send array
      const payload = formattedEntries.length === 1 ? formattedEntries[0] : { entries: formattedEntries };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Zapier webhooks require no-cors
        body: JSON.stringify(payload),
      });

      // With no-cors, we can't check response status, but request was sent
      return true;
    } catch (error) {
      console.error('Error sending to Zapier webhook:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [isEnabled, webhookUrl]);

  const testWebhook = useCallback(async (): Promise<boolean> => {
    if (!webhookUrl) return false;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Teste de conexão do BetTracker',
        }),
      });

      return true;
    } catch (error) {
      console.error('Error testing webhook:', error);
      return false;
    }
  }, [webhookUrl]);

  return {
    webhookUrl,
    setWebhookUrl,
    isEnabled,
    setEnabled,
    isSending,
    sendToWebhook,
    testWebhook,
  };
}
