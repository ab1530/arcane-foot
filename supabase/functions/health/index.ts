function respondJson(data: unknown, status = 200): Response {
  const res = new Response(JSON.stringify(data), { status });
  res.headers.set('content-type', 'application/json; charset=utf-8');
  res.headers.set('cache-control', 'no-store');
  return res;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  return respondJson({
    status: 'ok',
    service: 'supabase-edge-functions',
    function: 'health',
    timestamp: new Date().toISOString(),
  });
});
