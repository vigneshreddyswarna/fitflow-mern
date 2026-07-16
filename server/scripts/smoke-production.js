const baseUrl = process.env.SMOKE_BASE_URL || 'https://fitflow-mern.onrender.com';

async function check(path, validate) {
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const body = await response.text();
  if (!validate(body)) throw new Error(`${path} returned an unexpected response`);
}

check('/api/health', body => body.includes('"status":"ok"') && body.includes('"connected"'))
  .then(() => check('/', body => body.includes('<div id="root"></div>')))
  .then(() => console.log(`Production smoke checks passed for ${baseUrl}`)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
