const path = require('path');
const express = require('express');
const db = require('./db');
const {
  verifyPassword,
  parseCookies,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  SESSION_COOKIE,
} = require('./auth');

const WORK_AREAS = ['BAU', 'CEP', 'Deliverability', 'SCRAM', 'Commercial improvement', 'Other'];
const STATUSES = ['backlog', 'planned', 'in_progress', 'waiting', 'done', 'parked'];
const WORK_ITEM_FIELDS = [
  'title', 'work_area', 'owner', 'status', 'priority', 'due_date',
  'next_action', 'dependencies', 'technology', 'expected_benefit',
  'blocker', 'source_context', 'position',
];

const app = express();
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(res, token, expiresAt);
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.post('/api/logout', async (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  await destroySession(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.user);
});

app.use('/api', requireAuth);

app.get('/api/work-items', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM work_items ORDER BY status, position, id');
  res.json(rows);
});

app.post('/api/work-items', async (req, res) => {
  const body = req.body || {};
  if (!body.title || !String(body.title).trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const workArea = WORK_AREAS.includes(body.work_area) ? body.work_area : 'Other';
  const status = STATUSES.includes(body.status) ? body.status : 'backlog';
  const { rows } = await db.query(
    `INSERT INTO work_items
       (title, work_area, owner, status, priority, due_date, next_action,
        dependencies, technology, expected_benefit, blocker, source_context, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      String(body.title).trim(),
      workArea,
      body.owner || '',
      status,
      body.priority || 'To confirm',
      body.due_date || null,
      body.next_action || '',
      body.dependencies || '',
      body.technology || '',
      body.expected_benefit || '',
      body.blocker || '',
      body.source_context || '',
      Number.isFinite(body.position) ? body.position : Date.now(),
    ]
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/work-items/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const sets = [];
  const values = [];
  for (const field of WORK_ITEM_FIELDS) {
    if (!(field in body)) continue;
    if (field === 'work_area' && !WORK_AREAS.includes(body[field])) continue;
    if (field === 'status' && !STATUSES.includes(body[field])) continue;
    values.push(body[field]);
    sets.push(`${field} = $${values.length}`);
  }
  if (sets.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  values.push(id);
  const { rows } = await db.query(
    `UPDATE work_items SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(rows[0]);
});

app.delete('/api/work-items/:id', async (req, res) => {
  await db.query('DELETE FROM work_items WHERE id = $1', [Number(req.params.id)]);
  res.status(204).end();
});

app.get('/api/decisions', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM decisions ORDER BY status, id');
  res.json(rows);
});

app.post('/api/decisions', async (req, res) => {
  const body = req.body || {};
  if (!body.text || !String(body.text).trim()) {
    res.status(400).json({ error: 'Decision text is required' });
    return;
  }
  const { rows } = await db.query(
    'INSERT INTO decisions (text, decider, status, resolution) VALUES ($1,$2,$3,$4) RETURNING *',
    [String(body.text).trim(), body.decider || '', body.status === 'decided' ? 'decided' : 'open', body.resolution || '']
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/decisions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const sets = [];
  const values = [];
  for (const field of ['text', 'decider', 'status', 'resolution']) {
    if (!(field in body)) continue;
    values.push(body[field]);
    sets.push(`${field} = $${values.length}`);
  }
  if (sets.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  values.push(id);
  const { rows } = await db.query(
    `UPDATE decisions SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(rows[0]);
});

app.delete('/api/decisions/:id', async (req, res) => {
  await db.query('DELETE FROM decisions WHERE id = $1', [Number(req.params.id)]);
  res.status(204).end();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ECRM Operations Hub listening on http://localhost:${port}`);
});
