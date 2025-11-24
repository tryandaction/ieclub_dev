const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Test server works!' }));
});

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Test server listening on port 3000');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
