import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

const ROOM_PATTERN = /^[a-zA-Z0-9_-]{8,32}$/;
const ROOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type CollaborationStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "offline"
  | "error";

function readRoomFromUrl(): string | null {
  const room = new URLSearchParams(window.location.search).get("room");
  return room && ROOM_PATTERN.test(room) ? room : null;
}

function createRoomId(): string {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(
      bytes,
      (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length],
    ).join("");
  }
  return Array.from(
    { length: 10 },
    () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)],
  ).join("");
}

function roomUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("room", roomId);
  return url.toString();
}

interface UseCollaborationOptions {
  markdown: string;
  setMarkdown: (value: string) => void;
  name: string;
}

export interface CollaborationState {
  roomId: string | null;
  status: CollaborationStatus;
  collaboratorCount: number;
  shareUrl: string;
  createRoom: () => Promise<string | null>;
  syncLocalChange: (nextValue: string) => void;
  setName: (nextName: string) => void;
}

export function useCollaboration({
  markdown,
  setMarkdown,
  name,
}: UseCollaborationOptions): CollaborationState {
  const [roomId, setRoomId] = useState<string | null>(readRoomFromUrl);
  const [status, setStatus] = useState<CollaborationStatus>(
    roomId ? "connecting" : "idle",
  );
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const syncedMarkdownRef = useRef(markdown);
  const markdownRef = useRef(markdown);
  const nameRef = useRef(name);

  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  const setRoomUrl = useCallback((nextRoomId: string) => {
    window.history.replaceState({}, "", roomUrl(nextRoomId));
  }, []);

  const updatePresence = useCallback(() => {
    const provider = providerRef.current;
    if (provider) setCollaboratorCount(provider.awareness.getStates().size);
  }, []);

  const connect = useCallback(
    async (
      nextRoomId: string,
      { seed = false }: { seed?: boolean } = {},
    ): Promise<boolean> => {
      if (activeRoomRef.current === nextRoomId && providerRef.current)
        return true;
      providerRef.current?.destroy();
      setStatus("connecting");
      setRoomUrl(nextRoomId);

      try {
        const doc = new Y.Doc();
        const provider = new WebrtcProvider(nextRoomId, doc, {
          signaling: ["wss://signaling.yjs.dev"],
          password: nextRoomId,
          maxConns: 20,
          filterBcConns: false,
        });
        const yText = doc.getText("markdown");
        docRef.current = doc;
        providerRef.current = provider;
        yTextRef.current = yText;
        activeRoomRef.current = nextRoomId;
        syncedMarkdownRef.current = markdownRef.current;

        yText.observe(() => {
          const nextValue = yText.toString();
          if (nextValue === syncedMarkdownRef.current) return;
          syncedMarkdownRef.current = nextValue;
          setMarkdown(nextValue);
        });

        provider.awareness.setLocalStateField("user", {
          name: nameRef.current || "Guest writer",
          color: "#f2633d",
        });
        provider.awareness.on("change", updatePresence);
        provider.on("status", ({ connected }: { connected: boolean }) => {
          setStatus(connected ? "connected" : "offline");
          updatePresence();
        });
        updatePresence();

        if (seed && yText.length === 0) {
          doc.transact(
            () => yText.insert(0, markdownRef.current),
            "initial-seed",
          );
        }
        setRoomId(nextRoomId);
        setStatus("connected");
        return true;
      } catch (error) {
        console.error("Realtime collaboration failed", error);
        activeRoomRef.current = null;
        setStatus("error");
        return false;
      }
    },
    [setMarkdown, setRoomUrl, updatePresence],
  );

  const createRoom = useCallback(async (): Promise<string | null> => {
    const nextRoomId = roomId || createRoomId();
    const connected = await connect(nextRoomId, { seed: !roomId });
    if (connected) setRoomId(nextRoomId);
    return connected ? nextRoomId : null;
  }, [connect, roomId]);

  const syncLocalChange = useCallback((nextValue: string): void => {
    const yText = yTextRef.current;
    const doc = docRef.current;
    if (!yText || !doc || nextValue === syncedMarkdownRef.current) return;
    const previousValue = syncedMarkdownRef.current;
    let start = 0;
    while (
      start < previousValue.length &&
      start < nextValue.length &&
      previousValue[start] === nextValue[start]
    )
      start += 1;
    let oldEnd = previousValue.length;
    let newEnd = nextValue.length;
    while (
      oldEnd > start &&
      newEnd > start &&
      previousValue[oldEnd - 1] === nextValue[newEnd - 1]
    ) {
      oldEnd -= 1;
      newEnd -= 1;
    }
    const deletedLength = oldEnd - start;
    const insertedText = nextValue.slice(start, newEnd);
    doc.transact(() => {
      if (deletedLength) yText.delete(start, deletedLength);
      if (insertedText) yText.insert(start, insertedText);
    }, "local-input");
    syncedMarkdownRef.current = nextValue;
  }, []);

  const setName = useCallback((nextName: string): void => {
    nameRef.current = nextName;
    providerRef.current?.awareness.setLocalStateField("user", {
      name: nextName || "Guest writer",
      color: "#f2633d",
    });
  }, []);

  useEffect(() => {
    if (roomId) void connect(roomId);
  }, [connect, roomId]);

  useEffect(
    () => () => {
      providerRef.current?.destroy();
      providerRef.current = null;
      activeRoomRef.current = null;
    },
    [],
  );

  return useMemo(
    () => ({
      roomId,
      status,
      collaboratorCount,
      shareUrl: roomId ? roomUrl(roomId) : "",
      createRoom,
      syncLocalChange,
      setName,
    }),
    [collaboratorCount, createRoom, roomId, setName, status, syncLocalChange],
  );
}
