import fs from "fs";
import http from "http";

function createApp(port, html) {
  http
    .createServer((req, res) => {
      const { url } = req;
      if (["/", "/login"].includes(url)) {
        res.end(fs.readFileSync(html));
        return;
      }
      if (url.endsWith(".js")) {
        res.writeHead(200, {
          "Content-Type": "text/javascript",
        });
        res.end(fs.readFileSync("./chat.js"));
        return;
      }
      res.end("");
    })
    .listen(port, () => {
      console.info(`server port at ${port}`);
    });
}

createApp(3000, "./a.html");
createApp(4000, "./b.html");
createApp(5858, "./c.html");
