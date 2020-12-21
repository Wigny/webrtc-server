import { App, PORT } from './app';

const { server } = new App();

server.listen(process.env.PORT, () =>
  console.log(`Running in ${PORT}`)
);
