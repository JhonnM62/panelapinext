import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { sessionsAPI } from '@/lib/api';

export interface SessionData {
  sesionId: string;
  nombresesion: string;
  numeroWhatsapp: string;
  estado: string;
  disponible: boolean;
  fechaCreacion: string;
}

export interface UseSessionsReturn {
  sessions: SessionData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSessionById: (id: string) => SessionData | undefined;
  hasAvailableSessions: boolean;
}

export const useSessions = (): UseSessionsReturn => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.getAvailableSessions();
      
      if (response.data?.success) {
        setSessions(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Error cargando sesiones');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error cargando sesiones';
      setError(errorMessage);
      
      console.error('Error cargando sesiones:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getSessionById = useCallback((id: string): SessionData | undefined => {
    return sessions.find(session => session.sesionId === id);
  }, [sessions]);

  const hasAvailableSessions = sessions.length > 0;

  // Cargar sesiones al montar el hook
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    sessions,
    isLoading,
    error,
    refresh,
    getSessionById,
    hasAvailableSessions
  };
};
