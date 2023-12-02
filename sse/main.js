import Koa from "koa";
import Router from "@koa/router";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = new Koa();
const router = new Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
router.get("/", (ctx, next) => {
  ctx.set("Content-Type", "text/html");
  ctx.body = fs.createReadStream(path.resolve(__dirname, "./index.html"));
  next();
});

let id = "";
router.post("/api/close-account", (ctx, next) => {
  ctx.set("Content-Type", "application/json");

  id = Date.now();
  // return the id to UI
  ctx.body = { id };

  next();
});

router.get("/api/close-account", (ctx, next) => {
  return new Promise((resolve) => {
    // mock to call HUB
    setTimeout(() => {
      // catch the id
      writeSSE(
        ctx,
        id,
        JSON.stringify({
          a: "123",
          list: new Array(100).fill(1).map((it, i) => ({
            id: i,
            content: Math.random().toString(36).slice(-8),
          })),
        })
      );
      resolve();
    }, 3000);
  });
});

function writeSSE(ctx, id, message) {
  ctx.res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  ctx.res.write(`id: ${id}\n`);
  ctx.res.write(`data: ${message}\n\n`);
}

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log("server start at port 3000");
});
