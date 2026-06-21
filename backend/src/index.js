import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import aiRoutes from './routes/ai.js';
import fileRoutes from './routes/files.js';
import paymentRoutes from './routes/payment.js';

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://frontend-kappa-sepia-39.vercel.app',
];

const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Terminal WebSocket - simple echo for non-pty environments
const terminals = new Map();

io.of('/terminal').on('connection', (socket) => {
  console.log('Terminal client connected:', socket.id);

  socket.on('start', () => {
    const termState = { buffer: '', cols: 80, rows: 24 };
    terminals.set(socket.id, termState);

    socket.emit('data', '\x1b[1;32mFreeCode AI Terminal\x1b[0m\r\n');
    socket.emit('data', 'Type commands below (simulated):\r\n');
    socket.emit('data', '$ ');
  });

  socket.on('input', (data) => {
    const term = terminals.get(socket.id);
    if (!term) return;

    term.buffer += data;

    if (data === '\r') {
      const cmd = term.buffer.trim().replace(/\r/g, '');
      term.buffer = '';

      if (cmd === 'clear') {
        socket.emit('data', '\x1b[2J\x1b[H');
      } else if (cmd === 'help') {
        socket.emit('data', 'Available commands: help, clear, echo, ls, pwd, date\r\n');
      } else if (cmd.startsWith('echo ')) {
        socket.emit('data', cmd.substring(5) + '\r\n');
      } else if (cmd === 'ls') {
        socket.emit('data', 'main.js  app.py  package.json  README.md\r\n');
      } else if (cmd === 'pwd') {
        socket.emit('data', '/workspace\r\n');
      } else if (cmd === 'date') {
        socket.emit('data', new Date().toString() + '\r\n');
      } else if (cmd) {
        socket.emit('data', `Command not found: ${cmd}\r\n`);
      }

      socket.emit('data', '$ ');
    }
  });

  socket.on('disconnect', () => {
    terminals.delete(socket.id);
    console.log('Terminal disconnected:', socket.id);
  });
});

async function start() {
  await initDb();
  httpServer.listen(config.port, () => {
    console.log(`FreeCode AI Backend running on port ${config.port}`);
    console.log(`Frontend URL: ${config.frontendUrl}`);
  });
}

start();
