import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApplication } from "./app.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 4310);
const production = process.argv.includes("--production");
const instance = createApplication({
  dataDir: process.env.ATELIER_DATA_DIR ?? join(root, "data"),
  demo: process.env.ATELIER_DEMO !== "0",
});
let vite;
if (!production) {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    configLoader: "native",
    server: { middlewareMode: true },
    appType: "spa",
  });
  instance.app.use(vite.middlewares);
} else {
  instance.app.use(express.static(join(root, "dist")));
  instance.app.use((req, res) =>
    res.sendFile(join(root, "dist", "index.html")),
  );
}
instance.app.use(instance.errorHandler);
const server = instance.app.listen(port, "127.0.0.1", () =>
  console.log(
    `\n  ATELIER · Espace juridique local\n  http://127.0.0.1:${port}\n  Données : ${process.env.ATELIER_DATA_DIR ?? join(root, "data")}\n`,
  ),
);
server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `Le port ${port} est déjà utilisé. Changez PORT ou ouvrez l’instance existante.`
      : e,
  );
  process.exitCode = 1;
  void instance.close().then(() => vite?.close());
});
let closing = false;
async function stop() {
  if (closing) return;
  closing = true;
  server.close();
  server.closeAllConnections();
  await instance.close();
  await vite?.close();
}
instance.app.locals.shutdown = stop;
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
