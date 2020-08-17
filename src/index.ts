import { App, PORT } from './app';

const { server } = new App();

server.listen(PORT, () =>
  console.log(`Running in ${PORT}`)
);
