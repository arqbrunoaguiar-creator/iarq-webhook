const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://ykedzhcqmoqpdweqvwhx.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_KEY  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZWR6aGNxbW9xcGR3ZXF2d2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDM2NDIsImV4cCI6MjA4ODIxOTY0Mn0.8sMUWGS9Ftqg3s-hKC1EoUugKje8N8mSA8-uhPqEge8';
const HOTMART_TOKEN = process.env.HOTMART_TOKEN || 'COLE_SEU_HOTTOK_AQUI';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-hotmart-hottok'];
  if (HOTMART_TOKEN !== 'COLE_SEU_HOTTOK_AQUI' && token !== HOTMART_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;
  const event = body?.event || body?.data?.event;
  const validEvents = ['PURCHASE_COMPLETE','PURCHASE_APPROVED','PURCHASE_BILLET_PRINTED','SUBSCRIPTION_ACTIVE'];

  if (!validEvents.includes(event)) {
    return res.status(200).json({ ok: true, ignored: true, event });
  }

  const email = (
    body?.data?.buyer?.email ||
    body?.buyer?.email ||
    body?.data?.subscriber?.email ||
    body?.purchase?.buyer?.email
  );

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'No email found' });
  }

  const emailLower = email.toLowerCase().trim();
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { error } = await sb.from('pro_emails').upsert({
    email:        emailLower,
    activated_at: new Date().toISOString(),
    source:       'hotmart',
    event:        event,
    hotmart_id:   body?.data?.purchase?.transaction || body?.purchase?.transaction || null,
  }, { onConflict: 'email' });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, email: emailLower, event });
};
