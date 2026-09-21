import { stdin, stdout } from "node:process";
import type { Readable, Writable } from "node:stream";

export type PromptFn = (question: string) => Promise<string>;

/**
 * Lee una línea (hasta \n) de un stream escribiendo la pregunta en otro.
 * Implementación propia: en Bun, `rl.question()` de readline/promises solo
 * resuelve la PRIMERA llamada y las siguientes se cuelgan.
 */
export async function promptWithStreams(
  question: string,
  input: Readable,
  output: Writable,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let settled = false;

    const cleanup = () => {
      input.removeListener("data", onData);
      input.removeListener("end", onEnd);
      input.removeListener("error", onError);
      output.removeListener("error", onError);
    };
    const finish = (line: string) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(line.trim());
    };
    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, "");
        buffer = buffer.slice(idx + 1);
        finish(line);
        return;
      }
    };
    const onEnd = () => {
      finish(buffer);
      buffer = "";
    };
    const onError = (err: Error) => {
      settled = true;
      cleanup();
      reject(err);
    };

    input.on("data", onData);
    input.on("end", onEnd);
    input.on("error", onError);
    output.on("error", onError);

    output.write(question);
  });
}

// --- Singleton para la app: un solo set de listeners sobre process.stdin ---

const lines: string[] = [];
let buffer = "";
let closed = false;
let resolver: (() => void) | null = null;

/** Despierta al prompt que esté esperando si hay línea disponible o EOF. */
function pump(): void {
  if (resolver && (lines.length > 0 || closed)) {
    const wake = resolver;
    resolver = null;
    wake();
  }
}

stdin.on("data", (chunk: Buffer | string) => {
  buffer += chunk.toString();
  let idx: number;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    lines.push(buffer.slice(0, idx).replace(/\r$/, ""));
    buffer = buffer.slice(idx + 1);
  }
  pump();
});

stdin.on("end", () => {
  closed = true;
  if (buffer.length > 0) {
    lines.push(buffer);
    buffer = "";
  }
  pump();
});

/** Indica si la entrada se cerró (EOF), p. ej. al pipear entrada. */
export function isPromptClosed(): boolean {
  return closed;
}

/** Libera los listeners de stdin para que el proceso pueda terminar. */
export function closePrompt(): void {
  closed = true;
  stdin.removeAllListeners("data");
  stdin.removeAllListeners("end");
  stdin.pause();
  lines.length = 0;
  pump();
}

/** Hace una pregunta en la consola y recorta la respuesta. */
export const prompt: PromptFn = async (question: string) => {
  stdout.write(question);
  while (lines.length === 0 && !closed) {
    await new Promise<void>((resolve) => {
      resolver = resolve;
    });
  }
  return (lines.shift() ?? "").trim();
};