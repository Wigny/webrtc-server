const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(4000, () => console.log('Server is running'));

app.use(express.static(__dirname + '/public'));

io.on('error', console.error);

let broadcaster;

io.on('connection', socket => {
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });

  socket.on('watcher', () => socket
    .to(broadcaster)
    .emit('watcher', socket.id)
  );

  socket.on('disconnect', () => socket
    .to(broadcaster)
    .emit('disconnectPeer', socket.id)
  );

  socket.on('offer', (id, message) => socket
    .to(id)
    .emit('offer', socket.id, message)
  );

  socket.on('answer', (id, message) => socket
    .to(id)
    .emit('answer', socket.id, message)
  );

  socket.on('candidate', (id, message) => socket
    .to(id)
    .emit('candidate', socket.id, message));
});