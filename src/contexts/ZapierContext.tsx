import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useZapierWebhook } from '@/hooks/useZapierWebhook';
import { Entrada, useBanca } from '@/contexts/BancaContext';
import { toast } from 'sonner';

interface ZapierContextType {
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  isSending: boolean;
  sendToWebhook: (entradas: Entrada[], bancaName: string) => Promise<boolean>;
  testWebhook: () => Promise<boolean>;
}

const ZapierContext = createContext<ZapierContextType | undefined>(undefined);

export function ZapierProvider({ children }: { children: ReactNode }) {
  const zapier = useZapierWebhook();
  const { onEntradasAdded } = useBanca();

  // Register callback to send new entries to Zapier
  useEffect(() => {
    const unsubscribe = onEntradasAdded(async (entradas, bancaName) => {
      if (zapier.isEnabled && zapier.webhookUrl) {
        const success = await zapier.sendToWebhook(entradas, bancaName);
        if (success) {
          toast.success(`${entradas.length} entrada(s) enviada(s) para o Zapier`);
        }
      }
    });

    return unsubscribe;
  }, [onEntradasAdded, zapier]);

  return (
    <ZapierContext.Provider value={zapier}>
      {children}
    </ZapierContext.Provider>
  );
}

export function useZapier() {
  const context = useContext(ZapierContext);
  if (context === undefined) {
    throw new Error('useZapier must be used within a ZapierProvider');
  }
  return context;
}
