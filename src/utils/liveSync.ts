/**
 * Real-Time Multi-Device Live Synchronization Engine
 * Powered by open Web standards (WebSocket / SSE / HTTP PubSub relay)
 * Enables live 2-way synchronization across student phones, iPads, and teacher host projector screens
 * Fully functional on static hosting (GitHub Pages) with zero configuration or API keys required.
 */

import { StudentRosterItem, MemoryNote, GroupStrategyEntry, FinishWellCardData, IndividualReflectionData, SentimentType } from '../types';

export interface LiveSyncMessage<T = unknown> {
  id: string;
  senderId: string;
  action: string;
  payload: T;
  timestamp: number;
}

export type LiveSyncStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// Unique persistent ID for this specific device/browser instance
export const getMyDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('s17_device_id');
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      localStorage.setItem('s17_device_id', id);
    } catch {
      // ignore
    }
  }
  return id;
};

// Retrieve or initialize the active classroom room ID
export const getLiveSyncRoom = (): string => {
  if (typeof window === 'undefined') return 's17-cce-term4';
  try {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || params.get('session');
    if (roomParam && roomParam.trim()) {
      const clean = roomParam.trim();
      localStorage.setItem('s17_sync_room', clean);
      return clean;
    }

    if (window.location.hash) {
      const hashStr = window.location.hash.replace(/^#\/?/, '');
      const queryIdx = hashStr.indexOf('?');
      if (queryIdx >= 0) {
        const hashParams = new URLSearchParams(hashStr.substring(queryIdx + 1));
        const hashRoom = hashParams.get('room') || hashParams.get('session');
        if (hashRoom && hashRoom.trim()) {
          const clean = hashRoom.trim();
          localStorage.setItem('s17_sync_room', clean);
          return clean;
        }
      }
    }

    const saved = localStorage.getItem('s17_sync_room');
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch (e) {
    console.warn('Could not read room from URL', e);
  }

  return 's17-cce-term4';
};

export const setLiveSyncRoom = (newRoom: string) => {
  if (typeof window === 'undefined') return;
  const clean = newRoom.trim() || 's17-cce-term4';
  localStorage.setItem('s17_sync_room', clean);
  reconnectSync();
};

export const sanitizeTopicName = (room: string): string => {
  const base = room.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
  return `s17cce_${base || 's17_default'}`;
};

// Internal State
let activeWs: WebSocket | null = null;
let activeEventSource: EventSource | null = null;
let reconnectTimer: any = null;
let currentStatus: LiveSyncStatus = 'disconnected';
let eventsReceivedCount = 0;
let lastEventTimestamp = 0;
const seenEventIds = new Set<string>();

type StatusListener = (status: LiveSyncStatus, details: { count: number; lastTime: number; room: string }) => void;
const statusListeners = new Set<StatusListener>();

type RemoteActionListener = (action: string, payload: any, senderId: string) => void;
const actionListeners = new Set<RemoteActionListener>();

export const subscribeToLiveStatus = (listener: StatusListener) => {
  statusListeners.add(listener);
  listener(currentStatus, {
    count: eventsReceivedCount,
    lastTime: lastEventTimestamp,
    room: getLiveSyncRoom(),
  });
  return () => {
    statusListeners.delete(listener);
  };
};

export const subscribeToRemoteActions = (listener: RemoteActionListener) => {
  actionListeners.add(listener);
  return () => {
    actionListeners.delete(listener);
  };
};

const notifyStatus = (newStatus: LiveSyncStatus) => {
  currentStatus = newStatus;
  const details = {
    count: eventsReceivedCount,
    lastTime: lastEventTimestamp,
    room: getLiveSyncRoom(),
  };
  statusListeners.forEach((l) => {
    try {
      l(newStatus, details);
    } catch (e) {
      console.error(e);
    }
  });
};

/**
 * Handle incoming parsed message from WebSocket or EventSource
 */
const handleIncomingRawMessage = (rawStr: string) => {
  try {
    const data = JSON.parse(rawStr);
    
    // ntfy.sh message structure: { id, event, topic, time, message }
    let msgObj: LiveSyncMessage | null = null;
    if (data && data.message) {
      try {
        msgObj = JSON.parse(data.message);
      } catch {
        return;
      }
    } else if (data && data.action) {
      msgObj = data as LiveSyncMessage;
    }

    if (!msgObj || !msgObj.id || !msgObj.action) return;

    // Deduplication check
    if (seenEventIds.has(msgObj.id)) return;
    seenEventIds.add(msgObj.id);

    // Filter out our own messages
    if (msgObj.senderId === getMyDeviceId()) return;

    eventsReceivedCount++;
    lastEventTimestamp = msgObj.timestamp || Date.now();
    notifyStatus(currentStatus);

    // Notify listeners
    actionListeners.forEach((listener) => {
      try {
        listener(msgObj!.action, msgObj!.payload, msgObj!.senderId);
      } catch (err) {
        console.error('Error in remote action listener', err);
      }
    });
  } catch (err) {
    // Malformed message, ignore
  }
};

/**
 * Catch-up: Poll recent history on connect or refresh
 */
export const pollRecentEvents = async (): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  const topic = sanitizeTopicName(getLiveSyncRoom());
  const url = `https://ntfy.sh/${topic}/json?poll=1&since=6h`;

  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const text = await res.text();
    const lines = text.split('\n').filter((l) => l.trim().length > 0);

    let count = 0;
    for (const line of lines) {
      try {
        handleIncomingRawMessage(line);
        count++;
      } catch {
        // ignore individual line error
      }
    }
    return count;
  } catch (e) {
    console.warn('Could not poll recent events from ntfy', e);
    return 0;
  }
};

/**
 * Connect to real-time relay (WebSocket with EventSource fallback)
 */
export const startLiveSync = () => {
  if (typeof window === 'undefined') return;

  // Cleanup existing connections
  stopLiveSync();

  const room = getLiveSyncRoom();
  const topic = sanitizeTopicName(room);
  notifyStatus('connecting');

  // Immediately poll recent history first to catch up on any existing actions
  pollRecentEvents().catch(() => {});

  // Try WebSocket connection first
  try {
    const wsUrl = `wss://ntfy.sh/${topic}/ws`;
    activeWs = new WebSocket(wsUrl);

    activeWs.onopen = () => {
      notifyStatus('connected');
    };

    activeWs.onmessage = (event) => {
      handleIncomingRawMessage(event.data);
    };

    activeWs.onerror = () => {
      // Fallback to EventSource if WebSocket fails
      if (currentStatus !== 'connected') {
        fallbackToEventSource(topic);
      }
    };

    activeWs.onclose = () => {
      if (currentStatus === 'connected') {
        notifyStatus('disconnected');
        scheduleReconnect();
      }
    };
  } catch (err) {
    console.warn('WebSocket init failed, using EventSource fallback', err);
    fallbackToEventSource(topic);
  }
};

const fallbackToEventSource = (topic: string) => {
  try {
    if (activeEventSource) {
      activeEventSource.close();
    }
    const sseUrl = `https://ntfy.sh/${topic}/sse`;
    activeEventSource = new EventSource(sseUrl);

    activeEventSource.onopen = () => {
      notifyStatus('connected');
    };

    activeEventSource.onmessage = (event) => {
      handleIncomingRawMessage(event.data);
    };

    activeEventSource.onerror = () => {
      notifyStatus('error');
      scheduleReconnect();
    };
  } catch (e) {
    console.error('EventSource fallback failed', e);
    notifyStatus('error');
    scheduleReconnect();
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    startLiveSync();
  }, 4000);
};

export const reconnectSync = () => {
  stopLiveSync();
  startLiveSync();
};

export const stopLiveSync = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (activeWs) {
    try {
      activeWs.close();
    } catch {}
    activeWs = null;
  }
  if (activeEventSource) {
    try {
      activeEventSource.close();
    } catch {}
    activeEventSource = null;
  }
  notifyStatus('disconnected');
};

/**
 * Publish an action over the live cloud relay
 */
export const publishLiveAction = async (action: string, payload: unknown): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const room = getLiveSyncRoom();
  const topic = sanitizeTopicName(room);
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Record this ID locally so we don't process our own broadcast
  seenEventIds.add(eventId);

  const msg: LiveSyncMessage = {
    id: eventId,
    senderId: getMyDeviceId(),
    action,
    payload,
    timestamp: Date.now(),
  };

  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(msg),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to publish live action to cloud relay', err);
    return false;
  }
};
