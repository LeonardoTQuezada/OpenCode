import { describe, expect, test } from "bun:test";
import { PassThrough, Readable } from "node:stream";
import { promptWithStreams } from "../../src/presentation/input.ts";

function makeCaptureOutput(): { stream: PassThrough; chunks: string[] } {
  const chunks: string[] = [];
  const stream = new PassThrough();
  stream.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));
  return { stream, chunks };
}

describe("presentation/input", () => {
  test("promptWithStreams hace la pregunta y recorta la respuesta", async () => {
    const input = Readable.from(["  Madrid  \n"]) as Parameters<typeof promptWithStreams>[1];
    const { stream, chunks } = makeCaptureOutput();

    const answer = await promptWithStreams("Ciudad: ", input, stream);

    expect(answer).toBe("Madrid");
    expect(chunks.join("")).toContain("Ciudad: ");
  });

  test("promptWithStreams devuelve string vacío con entrada vacía", async () => {
    const input = Readable.from(["\n"]) as Parameters<typeof promptWithStreams>[1];
    const { stream } = makeCaptureOutput();
    const answer = await promptWithStreams("Otro: ", input, stream);
    expect(answer).toBe("");
  });
});