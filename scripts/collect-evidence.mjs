import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
// Collecte HTTP publique : ce HAR ne prétend pas être une session navigateur.
const urls = [
  "https://legora.com/product/tabular-review",
  "https://legora.com/product/word-add-in",
  "https://legora.com/product/editor",
];
await mkdir("evidence", { recursive: true });
const entries = [];
for (const url of urls) {
  const started = new Date();
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  if (!response.ok) throw Error(`${response.status} : ${url}`);
  entries.push({
    startedDateTime: started.toISOString(),
    time: Date.now() - started.getTime(),
    request: {
      method: "GET",
      url,
      httpVersion: "HTTP/1.1",
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: 0,
    },
    response: {
      status: response.status,
      statusText: response.statusText,
      httpVersion: "HTTP/1.1",
      headers: [
        {
          name: "Content-Type",
          value: response.headers.get("content-type") ?? "text/html",
        },
      ],
      cookies: [],
      content: { size: Buffer.byteLength(text), mimeType: "text/html", text },
      redirectURL: "",
      headersSize: -1,
      bodySize: Buffer.byteLength(text),
    },
    cache: {},
    timings: { send: 0, wait: Date.now() - started.getTime(), receive: 0 },
  });
}
await writeFile(
  "evidence/legora-public.har",
  JSON.stringify(
    {
      log: {
        version: "1.2",
        creator: {
          name: "Atelier direct public HTTP collector (not browser traffic)",
          version: "1.0",
        },
        entries,
      },
    },
    null,
    2,
  ),
);
console.log(
  `Collecte publique : ${entries.length} pages. ${resolve("evidence/legora-public.har")}`,
);
