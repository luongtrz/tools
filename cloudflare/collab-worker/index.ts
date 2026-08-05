import { Hocuspocus, type WebSocketLike } from "@hocuspocus/server";
import * as Y from "yjs";

const ROOM_PATTERN = /^[a-zA-Z0-9_-]{8,32}$/;
const ACCESS_TOKEN_PATTERN = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{32}$/;
const DOCUMENT_PREFIX = "toolmd";

interface Env {
  COLLAB_ROOM: DurableObjectNamespace;
}

interface CollaborationContext {
  roomId: string;
}

interface ParsedDocumentName {
  roomId: string;
  accessToken: string;
}

function parseRoomId(pathname: string): string | null {
  const match = pathname.match(/^\/room\/([a-zA-Z0-9_-]{8,32})\/?$/);
  return match && ROOM_PATTERN.test(match[1]) ? match[1] : null;
}

function parseDocumentName(documentName: string): ParsedDocumentName | null {
  const [prefix, roomId, accessToken] = documentName.split(":");
  if (
    prefix !== DOCUMENT_PREFIX ||
    !roomId ||
    !accessToken ||
    !ROOM_PATTERN.test(roomId) ||
    !ACCESS_TOKEN_PATTERN.test(accessToken)
  ) {
    return null;
  }
  return { roomId, accessToken };
}

class DurableObjectPersistence {
  constructor(private readonly storage: DurableObjectStorage) {}

  async onLoadDocument({
    documentName,
    document,
  }: {
    documentName: string;
    document: Y.Doc;
  }) {
    const stored = await this.storage.get<ArrayBuffer>(`document:${documentName}`);
    if (stored) Y.applyUpdate(document, new Uint8Array(stored));
  }

  async onStoreDocument({
    documentName,
    document,
  }: {
    documentName: string;
    document: Y.Doc;
  }) {
    await this.storage.put(
      `document:${documentName}`,
      Y.encodeStateAsUpdate(document),
    );
  }
}

export class CollaborationRoom {
  private readonly hocuspocus: Hocuspocus<CollaborationContext>;

  constructor(private readonly state: DurableObjectState) {
    this.hocuspocus = new Hocuspocus<CollaborationContext>({
      name: "toolmd-cloudflare-collaboration",
      quiet: true,
      debounce: 2_000,
      maxDebounce: 10_000,
      extensions: [new DurableObjectPersistence(state.storage)],
      async onAuthenticate({ context, documentName, token }) {
        const parsed = parseDocumentName(documentName);
        if (
          !parsed ||
          parsed.roomId !== context.roomId ||
          token !== parsed.accessToken
        ) {
          throw new Error("Invalid collaboration invite.");
        }
        return { roomId: parsed.roomId };
      },
    });
  }

  async fetch(request: Request): Promise<Response> {
    const roomId = parseRoomId(new URL(request.url).pathname);
    if (!roomId) {
      return new Response("Invalid collaboration room.", { status: 404 });
    }
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required.", { status: 426 });
    }

    const pair = new WebSocketPair();
    const clientSocket = pair[0];
    const serverSocket = pair[1];
    serverSocket.binaryType = "arraybuffer";
    serverSocket.accept();

    const connection = this.hocuspocus.handleConnection(
      serverSocket as unknown as WebSocketLike,
      request,
      { roomId },
    );

    serverSocket.addEventListener("message", (event) => {
      if (typeof event.data === "string") return;
      if (event.data instanceof ArrayBuffer) {
        connection.handleMessage(new Uint8Array(event.data));
        return;
      }
      if (ArrayBuffer.isView(event.data)) {
        connection.handleMessage(
          new Uint8Array(
            event.data.buffer,
            event.data.byteOffset,
            event.data.byteLength,
          ),
        );
      }
    });
    serverSocket.addEventListener("close", (event) => {
      connection.handleClose({ code: event.code, reason: event.reason });
    });
    serverSocket.addEventListener("error", () => {
      connection.handleClose({ code: 1011, reason: "socket_error" });
    });

    return new Response(null, { status: 101, webSocket: clientSocket });
  }
}

function jsonResponse(data: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return jsonResponse({ status: "ok" });
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });

    const roomId = parseRoomId(url.pathname);
    if (!roomId) return jsonResponse({ error: "Not found" }, 404);

    const durableObjectId = env.COLLAB_ROOM.idFromName(roomId);
    return env.COLLAB_ROOM.get(durableObjectId).fetch(request);
  },
};
