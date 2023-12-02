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

router.post("/api/show", (ctx, next) => {
  ctx.set("Content-Type", "application/json");

  ctx.body = { id: Date.now() };

  next();
});

router.get("/api/show", (ctx, next) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      writeSSE(ctx, JSON.stringify({ a: "123" }));
      resolve();
    }, 3000);
  });
});

function writeSSE(ctx, message) {
  ctx.res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  ctx.res.write(`id: 01\n`);
  ctx.res.write(`data: ${message}\n\n`);
}

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log("server start at port 3000");
});
