const OAUTH_HOST = 'https://github.com';
const TOKEN_HOST = 'https://github.com';
const OAUTH_PATH = '/login/oauth/authorize';
const TOKEN_PATH = '/login/oauth/access_token';
const SCOPE = 'repo,user';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: SCOPE,
        state: crypto.randomUUID(),
      });
      return Response.redirect(`${OAUTH_HOST}${OAUTH_PATH}?${params}`, 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const tokenRes = await fetch(`${TOKEN_HOST}${TOKEN_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await tokenRes.json();

      if (data.error) {
        return new Response(`OAuth error: ${data.error_description}`, { status: 401 });
      }

      const content = JSON.stringify({
        token: data.access_token,
        provider: 'github',
      });

      return new Response(`
<!doctype html>
<html><body><script>
(function() {
  function sendMsg(msg) {
    var lo = (opener || parent);
    lo.postMessage(msg, window.location.origin);
  }
  sendMsg('authorization:github:success:${content}');
})();
</script></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
