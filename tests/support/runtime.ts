import { startAuthFixture } from '../helpers/auth-fixture';
import { startTestBackend } from '../helpers/backend';
const store = process.env.FFC_TEST_STORE === '1';
const fixture = await startAuthFixture(Number(process.env.FFC_TEST_AUTH_PORT || 3100), store);
const child = await startTestBackend(fixture.url, Number(process.env.FFC_TEST_API_PORT || 3101), store);
const close = () => {
  child.kill();
  void fixture.close().then(() => process.exit(0));
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
