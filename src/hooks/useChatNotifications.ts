import { useState, useEffect, useCallback } from 'react';

interface ChatNotification {
  count: number;
  lastMessage?: string;
  timestamp: Date;
}

export const useChatNotifications = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Simular verificação de mensagens não lidas
  const checkUnreadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Aqui você pode integrar com sua API real
      // const response = await fetch('/api/chat/unread-count', {
      //   headers: {
      //     'Authorization': `Bearer ${getUserToken()}`
      //   }
      // });
      // const data = await response.json();
      
      // Simulação de dados
      const mockData = {
        count: Math.floor(Math.random() * 5), // 0-4 mensagens
        lastMessage: 'Nova mensagem recebida',
        timestamp: new Date()
      };

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotificationCount(mockData.count);
      setLastCheck(new Date());
      
      // Notificação sonora se houver novas mensagens
      if (mockData.count > 0) {
        playNotificationSound();
      }
      
    } catch (error) {
      console.error('Erro ao verificar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Criar um beep simples
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Erro ao tocar som de notificação:', error);
    }
  };

  // Limpar notificações
  const clearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  // Verificar mensagens periodicamente
  useEffect(() => {
    checkUnreadMessages();
    
    const interval = setInterval(checkUnreadMessages, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [checkUnreadMessages]);

  // Verificar quando a aba se torna visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUnreadMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkUnreadMessages]);

  return {
    notificationCount,
    isLoading,
    lastCheck,
    checkUnreadMessages,
    clearNotifications,
    playNotificationSound
  };
}; 