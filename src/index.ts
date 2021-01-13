import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: { origin: '*' },
});

let broadcaster: string;

io.on('connection', (socket: Socket) => {
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });

  socket.on('watcher', () => socket
    .to(broadcaster)
    .emit('watcher', socket.id),
  );

  socket.on('disconnect', () => socket
    .to(broadcaster)
    .emit('disconnectPeer', socket.id),
  );

  socket.on('offer', (id, message) => socket
    .to(id)
    .emit('offer', socket.id, message),
  );

  socket.on('answer', (id, message) => socket
    .to(id)
    .emit('answer', socket.id, message),
  );

  socket.on('candidate', (id, message) => socket
    .to(id)
    .emit('candidate', socket.id, message));
});

app.get('/', (_req, res) => res.json({
  running: true
}))

http.listen(process.env.PORT || 8080, () => {
  console.log(`Running in ${process.env.PORT || 8080}`);
});
