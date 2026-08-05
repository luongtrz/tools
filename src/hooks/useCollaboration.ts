import { HocuspocusProvider } from "@hocuspocus/provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

const ROOM_PATTERN = /^[a-zA-Z0-9_-]{8,32}$/;
const ACCESS_TOKEN_PATTERN = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{32}$/;
const ACCESS_TOKEN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const DOCUMENT_PREFIX = "toolmd";
const CONNECTION_TIMEOUT = 10_000;
const DEFAULT_COLLABORATION_URL = import.meta.env.DEV
  ? "ws://localhost:8787"
  : "wss://toolmd-collab.22120199.workers.dev";
const COLLABORATION_URL =
  import.meta.env.VITE_COLLABORATION_URL || DEFAULT_COLLABORATION_URL;

export type CollaborationStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "offline"
  | "error";

interface CollaborationLink {
  roomId: string;
  accessToken: string;
}

function readCollaborationLink(): CollaborationLink | null {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");
  const accessToken = params.get("key");
  if (
    !roomId ||
    !accessToken ||
    !ROOM_PATTERN.test(roomId) ||
    !ACCESS_TOKEN_PATTERN.test(accessToken)
  ) {
    return null;
  }
  return { roomId, accessToken };
}

function createRoomId(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(
      "",
    );
  }
  return Array.from(
    { length: 10 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

function createAccessToken(): string {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(
      bytes,
      (byte) => ACCESS_TOKEN_ALPHABET[byte % ACCESS_TOKEN_ALPHABET.length],
    ).join("");
  }
  return Array.from(
    { length: 32 },
    () =>
      ACCESS_TOKEN_ALPHABET[
        Math.floor(Math.random() * ACCESS_TOKEN_ALPHABET.length)
      ],
  ).join("");
}

function collaborationDocumentName(
  roomId: string,
  accessToken: string,
): string {
  return `${DOCUMENT_PREFIX}:${roomId}:${accessToken}`;
}

function roomUrl(roomId: string, accessToken: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("room", roomId);
  url.searchParams.set("key", accessToken);
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
  syncLocalChange: (value: string) => void;
  setName: (nextName: string) => void;
}

export function useCollaboration({
  markdown,
  setMarkdown,
  name,
}: UseCollaborationOptions): CollaborationState {
  const [roomId, setRoomId] = useState(
    () => readCollaborationLink()?.roomId ?? null,
  );
  const [accessToken, setAccessToken] = useState(
    () => readCollaborationLink()?.accessToken ?? null,
  );
  const [status, setStatus] = useState<CollaborationStatus>(() =>
    roomId && accessToken ? "connecting" : "idle",
  );
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const activeDocumentRef = useRef<string | null>(null);
  const syncedMarkdownRef = useRef(markdown);
  const markdownRef = useRef(markdown);
  const nameRef = useRef(name);

  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  const setRoomUrl = useCallback((nextRoomId: string, nextToken: string) => {
    window.history.replaceState({}, "", roomUrl(nextRoomId, nextToken));
  }, []);

  const updatePresence = useCallback(() => {
    const awareness = providerRef.current?.awareness;
    setCollaboratorCount(awareness?.getStates().size ?? 0);
  }, []);

  const connect = useCallback(
    async (
      nextRoomId: string,
      nextAccessToken: string,
      { seed = false }: { seed?: boolean } = {},
    ): Promise<boolean> => {
      const nextDocumentName = collaborationDocumentName(
        nextRoomId,
        nextAccessToken,
      );
      const collaborationUrl = `${COLLABORATION_URL.replace(/\/$/, "")}/room/${encodeURIComponent(nextRoomId)}`;
      if (
        activeDocumentRef.current === nextDocumentName &&
        providerRef.current
      ) {
        return providerRef.current.isSynced;
      }
      if (!COLLABORATION_URL) {
        setStatus("error");
        return false;
      }

      providerRef.current?.destroy();
      providerRef.current = null;
      activeDocumentRef.current = null;
      setStatus("connecting");

      const doc = new Y.Doc();
      const yText = doc.getText("markdown");
      let resolveConnection!: (connected: boolean) => void;
      let connectionSettled = false;
      let timeoutId: number | undefined;
      const connectionResult = new Promise<boolean>((resolve) => {
        resolveConnection = (connected: boolean) => {
          if (connectionSettled) return;
          connectionSettled = true;
          if (timeoutId) window.clearTimeout(timeoutId);
          resolve(connected);
        };
      });

      const finishConnection = (connected: boolean): void => {
        resolveConnection(connected);
      };

      const provider = new HocuspocusProvider({
        url: collaborationUrl,
        name: nextDocumentName,
        document: doc,
        token: nextAccessToken,
        flushDelay: 250,
        onStatus: ({ status: providerStatus }) => {
          if (providerStatus === "connecting") setStatus("connecting");
          if (providerStatus === "disconnected") setStatus("offline");
          if (
            providerStatus === "connected" &&
            !providerRef.current?.isSynced
          )
            setStatus("connecting");
          updatePresence();
        },
        onSynced: () => {
          if (seed && yText.length === 0) {
            doc.transact(
              () => yText.insert(0, markdownRef.current),
              "initial-seed",
            );
          }
          setStatus("connected");
          updatePresence();
          finishConnection(true);
        },
        onAuthenticationFailed: () => {
          setStatus("error");
          finishConnection(false);
        },
        onDisconnect: () => {
          setStatus("offline");
          updatePresence();
          if (!providerRef.current?.isSynced) finishConnection(false);
        },
        onClose: () => {
          setStatus("offline");
          updatePresence();
          if (!providerRef.current?.isSynced) finishConnection(false);
        },
        onAwarenessChange: updatePresence,
      });

      docRef.current = doc;
      providerRef.current = provider;
      yTextRef.current = yText;
      activeDocumentRef.current = nextDocumentName;
      syncedMarkdownRef.current = markdownRef.current;

      yText.observe(() => {
        const nextValue = yText.toString();
        if (nextValue === syncedMarkdownRef.current) return;
        syncedMarkdownRef.current = nextValue;
        setMarkdown(nextValue);
      });

      provider.setAwarenessField("user", {
        name: nameRef.current || "Guest writer",
        color: "#f2633d",
      });
      updatePresence();

      timeoutId = window.setTimeout(() => {
        if (!provider.isSynced) {
          setStatus("offline");
          finishConnection(false);
        }
      }, CONNECTION_TIMEOUT);

      const connected = await connectionResult;
      if (!connected) return false;
      setRoomId(nextRoomId);
      setAccessToken(nextAccessToken);
      setRoomUrl(nextRoomId, nextAccessToken);
      return true;
    },
    [setMarkdown, setRoomUrl, updatePresence],
  );

  const createRoom = useCallback(async (): Promise<string | null> => {
    const nextRoomId = roomId || createRoomId();
    const nextAccessToken = accessToken || createAccessToken();
    const connected = await connect(nextRoomId, nextAccessToken, {
      seed: !roomId,
    });
    return connected ? nextRoomId : null;
  }, [accessToken, connect, roomId]);

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
    ) {
      start += 1;
    }
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
    providerRef.current?.setAwarenessField("user", {
      name: nextName || "Guest writer",
      color: "#f2633d",
    });
  }, []);

  useEffect(() => {
    if (roomId && accessToken) void connect(roomId, accessToken);
  }, [accessToken, connect, roomId]);

  useEffect(
    () => () => {
      providerRef.current?.destroy();
      providerRef.current = null;
      activeDocumentRef.current = null;
    },
    [],
  );

  return useMemo(
    () => ({
      roomId,
      status,
      collaboratorCount,
      shareUrl:
        roomId && accessToken ? roomUrl(roomId, accessToken) : "",
      createRoom,
      syncLocalChange,
      setName,
    }),
    [
      accessToken,
      collaboratorCount,
      createRoom,
      roomId,
      setName,
      status,
      syncLocalChange,
    ],
  );
}
