"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseWebSocketManagerProps {
  enabled?: boolean;
  userId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

// Singleton WebSocket Manager
class WebSocketSingleton {
  private static instance: WebSocketSingleton;
  private ws: WebSocket | null = null;
  private subscribers: Set<(message: any) => void> = new Set();
  private connectionCallbacks: Set<() => void> = new Set();
  private disconnectionCallbacks: Set<() => void> = new Set();
  private isConnecting = false;
  private lastConnectionTime = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  static getInstance(): WebSocketSingleton {
    if (!WebSocketSingleton.instance) {
      WebSocketSingleton.instance = new WebSocketSingleton();
    }
    return WebSocketSingleton.instance;
  }

  subscribe(callback: (message: any) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  onConnect(callback: () => void): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onDisconnect(callback: () => void): () => void {
    this.disconnectionCallbacks.add(callback);
    return () => this.disconnectionCallbacks.delete(callback);
  }

  async connect(userId: string): Promise<boolean> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastConnectionTime < 3000) {
      console.log("[WS Singleton] Rate limited");
      return this.isConnected();
    }

    if (this.isConnecting) {
      console.log("[WS Singleton] Connection already in progress");
      return false;
    }

    if (this.isConnected()) {
      console.log("[WS Singleton] Already connected");
      return true;
    }

    this.isConnecting = true;
    this.lastConnectionTime = now;

    try {
      await this.createConnection(userId);
      return true;
    } catch (error) {
      console.error("[WS Singleton] Connection failed:", error);
      this.isConnecting = false;
      return false;
    }
  }

  private async createConnection(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | undefined;

      try {
        this.ws = new WebSocket("ws://backend.autosystemprojects.site/ws");

        timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
          this.cleanup();
        }, 10000);

        this.ws.onopen = () => {
          if (timeout) clearTimeout(timeout);
          this.isConnecting = false;
          console.log("[WS Singleton] ✅ Connected");

          // Authenticate
          this.send({
            type: "authenticate",
            userId: userId,
          });

          this.connectionCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (e) {
              console.warn("Connection callback error:", e);
            }
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.subscribers.forEach((cb) => {
              try {
                cb(message);
              } catch (e) {
                console.warn("Message callback error:", e);
              }
            });
          } catch (e) {
            console.warn("[WS Singleton] Invalid message:", e);
          }
        };

        this.ws.onclose = () => {
          if (timeout) clearTimeout(timeout);
          console.log("[WS Singleton] 🔴 Disconnected");
          this.cleanup();
          this.disconnectionCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (e) {
              console.warn("Disconnection callback error:", e);
            }
          });

          // Auto-reconnect after 5 seconds
          this.scheduleReconnect(userId);
        };

        this.ws.onerror = (error) => {
          if (timeout) clearTimeout(timeout);
          console.error("[WS Singleton] ❌ Error:", error);
          this.cleanup();
          reject(error);
        };
      } catch (error) {
        if (timeout) clearTimeout(timeout);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private scheduleReconnect(userId: string): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (!this.isConnected()) {
        console.log("[WS Singleton] Attempting reconnection...");
        this.connect(userId);
      }
    }, 5000);
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState !== WebSocket.CLOSED) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(message: any): boolean {
    if (this.isConnected() && this.ws) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.cleanup();
  }
}

export function useWebSocketManager({
  enabled = true,
  userId,
  onConnect,
  onDisconnect,
  onMessage,
  onError,
}: UseWebSocketManagerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [lastUpsertMessage, setLastUpsertMessage] = useState<any>(null); // 🆕 Para AutoProcessor
  const wsManager = useRef(WebSocketSingleton.getInstance());

  const handleMessage = useCallback(
    (message: any) => {
      setLastMessage(message);

      // 🆕 Persistir específicamente MESSAGES_UPSERT para AutoProcessor
      if (message.type === "MESSAGES_UPSERT") {
        setLastUpsertMessage({
          ...message,
          timestamp: Date.now(),
          processed: false,
        });
        console.log(
          "[WS Manager] 📨 MESSAGES_UPSERT capturado para AutoProcessor"
        );
      }

      onMessage?.(message);
    },
    [onMessage]
  );

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    onConnect?.();
  }, [onConnect]);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const manager = wsManager.current;

    // Subscribe to events
    const unsubscribeMessage = manager.subscribe(handleMessage);
    const unsubscribeConnect = manager.onConnect(handleConnect);
    const unsubscribeDisconnect = manager.onDisconnect(handleDisconnect);

    // Set initial connection state
    setIsConnected(manager.isConnected());

    // Connect if not already connected
    if (!manager.isConnected()) {
      manager.connect(userId).catch((error) => {
        console.error("[useWebSocketManager] Connection error:", error);
        onError?.(error);
      });
    }

    return () => {
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, [
    enabled,
    userId,
    handleMessage,
    handleConnect,
    handleDisconnect,
    onError,
  ]);

  const sendMessage = useCallback((message: any) => {
    return wsManager.current.send(message);
  }, []);

  const forceReconnect = useCallback(() => {
    if (userId) {
      wsManager.current.disconnect();
      setTimeout(() => {
        wsManager.current.connect(userId).catch((error) => {
          console.error("[useWebSocketManager] Reconnection error:", error);
          onError?.(error);
        });
      }, 1000);
    }
  }, [userId, onError]);

  const markUpsertAsProcessed = useCallback(() => {
    setLastUpsertMessage((prev: any) =>
      prev ? { ...prev, processed: true } : null
    );
  }, []);

  return {
    isConnected,
    lastMessage,
    lastUpsertMessage, // 🆕 Para AutoProcessor
    markUpsertAsProcessed, // 🆕 Marcar como procesado
    sendMessage,
    forceReconnect,
  };
}
