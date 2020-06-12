import app from './app';

app.listen(3333, () => {
  // eslint-disable-next-line no-console
  console.log(`☀️   Server pode ser testado ${process.env.APP_URL} ☀️`);
});
