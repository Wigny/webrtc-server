import express, { Application, Router } from "express";
import { Server as SocketServer, Socket } from "socket.io";
import { createServer, Server as HttpServer } from 'http';
import socketIO from "socket.io";
import dotenv from 'dotenv';
import path from "path";

dotenv.config();

const { PORT } = process.env;

class App {
  public server: HttpServer;
  private app: Application;
  private io: SocketServer;

  private public = path.join(__dirname, '..', '/public');

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = socketIO(this.server);

    this.routes();
    this.listen();
  }

  private routes(): void {
    const router = Router();

    router.get('/test', (_req, res) => res.json({
      runnig: true
    }));

    this.app.use(router);
    this.app.use(express.static(this.public));
  }

  private listen(): void {
    let broadcaster: string;

    const connection = (socket: Socket) => {
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
    }

    this.io.on('connection', connection);
  }
}

export { PORT, App };
