const http = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3004', 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> YeouAlba Frontend ready on http://0.0.0.0:${port}`);
    if (process.send) process.send('ready');
  });

  const shutdown = () => {
    console.log('> Shutting down...');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
