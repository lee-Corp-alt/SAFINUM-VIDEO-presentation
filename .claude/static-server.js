// Minimal static file server for local preview (supports range requests so video seeking works).
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 5173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) return res.writeHead(404).end("Not found");
      const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
      if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
        if (start > end) return res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
        res.writeHead(206, {
          "Content-Type": type,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": end - start + 1,
          "Accept-Ranges": "bytes",
        });
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Accept-Ranges": "bytes" });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
