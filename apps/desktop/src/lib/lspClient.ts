import { supabase } from "@/lib/supabase";
import { API_URL } from "@/lib/api";

interface JsonRpcMessage {
  jsonrpc?: "2.0";
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

type Diagnostic = {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  message: string;
  severity?: number;
};

/** Minimal JSON-RPC-over-WebSocket LSP client, wired directly to the two
 * things the editor needs: diagnostics (push) and completion/hover (pull).
 * ponytail: no incremental sync, no go-to-definition — full-document sync
 * and the two most-used features first; add more request types here as
 * Monaco providers need them, the wire plumbing already supports it. */
export class LspClient {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  private diagnosticsHandler: ((uri: string, diagnostics: Diagnostic[]) => void) | null = null;
  mirrorRoot = "";

  constructor(
    private conversationId: string,
    /** Which backend language-server process to route to (e.g. "typescript"
     * covers .ts/.tsx/.js/.jsx — one server, several LSP languageIds). */
    private route: string,
    /** The precise LSP languageId to report in didOpen (e.g. "typescriptreact"). */
    private languageId: string,
  ) {}

  onDiagnostics(handler: (uri: string, diagnostics: Diagnostic[]) => void) {
    this.diagnosticsHandler = handler;
  }

  async connect(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const wsUrl = `${API_URL.replace(/^http/, "ws")}/api/workspaces/${this.conversationId}/lsp/${this.route}`;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;
      let gotRoot = false;
      ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token }));
      ws.onerror = () => reject(new Error("LSP connection failed"));
      ws.onclose = () => {
        const error = new Error("LSP connection closed");
        this.rejectAllPending(error);
        if (!gotRoot) reject(error);
      };

      ws.onmessage = (evt) => {
        const message = JSON.parse(evt.data);
        if (!gotRoot && (message.KiroBot === "mirrorRoot" || message.kirobots === "mirrorRoot")) {
          this.mirrorRoot = message.root;
          gotRoot = true;
          ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
          resolve();
          return;
        }
      };
    });

    await this.request("initialize", {
      processId: null,
      rootUri: `file://${this.mirrorRoot}`,
      capabilities: {
        textDocument: {
          synchronization: { didSave: true },
          completion: { completionItem: { snippetSupport: false } },
          hover: { contentFormat: ["plaintext", "markdown"] },
          publishDiagnostics: {},
        },
      },
    });
    this.notify("initialized", {});
  }

  uriFor(workspacePath: string): string {
    return `file://${this.mirrorRoot}/${workspacePath.replace(/^\//, "")}`;
  }

  didOpen(workspacePath: string, text: string) {
    this.notify("textDocument/didOpen", {
      textDocument: { uri: this.uriFor(workspacePath), languageId: this.languageId, version: 1, text },
    });
  }

  didChange(workspacePath: string, text: string, version: number) {
    this.notify("textDocument/didChange", {
      textDocument: { uri: this.uriFor(workspacePath), version },
      contentChanges: [{ text }],
    });
  }

  didClose(workspacePath: string) {
    this.notify("textDocument/didClose", { textDocument: { uri: this.uriFor(workspacePath) } });
  }

  async completion(workspacePath: string, line: number, character: number) {
    return this.request("textDocument/completion", {
      textDocument: { uri: this.uriFor(workspacePath) },
      position: { line, character },
    });
  }

  async hover(workspacePath: string, line: number, character: number) {
    return this.request("textDocument/hover", {
      textDocument: { uri: this.uriFor(workspacePath) },
      position: { line, character },
    });
  }

  dispose() {
    this.ws?.close();
    this.ws = null;
  }

  private notify(method: string, params: unknown) {
    this.ws?.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  private request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws?.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    });
  }

  private rejectAllPending(err: unknown) {
    for (const { reject } of this.pending.values()) reject(err);
    this.pending.clear();
  }

  private handleMessage(message: JsonRpcMessage) {
    if (message.id !== undefined && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id)!;
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === "textDocument/publishDiagnostics" && this.diagnosticsHandler) {
      const params = message.params as { uri: string; diagnostics: Diagnostic[] };
      this.diagnosticsHandler(params.uri, params.diagnostics);
    }
  }
}
