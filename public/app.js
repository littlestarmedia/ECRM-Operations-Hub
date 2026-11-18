(function () {
  'use strict';

  const WORK_AREAS = ['BAU', 'CEP', 'Deliverability', 'SCRAM', 'Commercial improvement', 'Other'];
  const STATUSES = ['backlog', 'planned', 'in_progress', 'waiting', 'done', 'parked'];
  const STATUS_LABEL = { backlog: 'Backlog', planned: 'Planned', in_progress: 'In progress', waiting: 'Waiting', done: 'Done', parked: 'Parked' };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icons = () => { try { window.lucide && window.lucide.createIcons(); } catch (e) { /* no-op: icon library optional */ } };
  const tbc = (s) => esc(s).replace(/To confirm/g, '<strong style="color:var(--color-warning)">To confirm</strong>').replace(/[Oo]wner to agree/g, (m) => `<strong style="color:var(--color-warning)">${m}</strong>`).replace(/[Hh]andover needed/g, (m) => `<strong style="color:var(--color-warning)">${m}</strong>`);

  let workItems = [];
  let decisions = [];
  let listMode = 'board'; // board | list
  let filters = { owner: '', area: '', priority: '' };
  let editingId = null; // null = creating new

  // ---------- API ----------
  async function api(path, options) {
    const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options));
    if (res.status === 401) { showLogin(); throw new Error('Not signed in'); }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ---------- Auth / shell ----------
  function showLogin() {
    $('#login-screen').hidden = false;
    $('#app').hidden = true;
  }
  function showApp(user) {
    $('#login-screen').hidden = true;
    $('#app').hidden = false;
    $('#whoami').textContent = user.name + ' · ' + user.email;
  }

  async function checkAuth() {
    try {
      const user = await api('/api/me');
      showApp(user);
      await loadAll();
    } catch (e) {
      showLogin();
    }
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    $('#login-error').textContent = '';
    try {
      const user = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      showApp(user);
      await loadAll();
    } catch (err) {
      $('#login-error').textContent = 'Invalid email or password.';
    }
  });

  $('#logout-btn').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    showLogin();
  });

  // ---------- Theme ----------
  const root = document.documentElement;
  $('#ds-theme-toggle').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    $('#ds-theme-toggle').innerHTML = `<i data-lucide="${root.dataset.theme === 'dark' ? 'sun' : 'moon'}"></i>`;
    icons();
  });

  // ---------- View nav ----------
  function showView(view) {
    $$('.view').forEach((v) => { v.hidden = v.id !== 'view-' + view; });
    $$('#view-nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
  }
  $('#view-nav').addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    showView(a.dataset.view);
    history.replaceState(null, '', '#' + a.dataset.view);
  });
  showView((location.hash || '#overview').slice(1));

  // ---------- Load + render all ----------
  async function loadAll() {
    [workItems, decisions] = await Promise.all([api('/api/work-items'), api('/api/decisions')]);
    renderFilters();
    renderOverview();
    renderBoard();
    renderList();
    renderProcess();
    renderUpcoming();
    renderMeetings();
    renderRob();
    icons();
  }

  // ---------- Overview ----------
  function renderOverview() {
    const open = workItems.filter((i) => i.status !== 'done');
    const priority = open.filter((i) => /^Now/.test(i.priority)).slice(0, 8);
    $('#ov-priority').innerHTML = priority.length
      ? priority.map((i) => `<div class="li"><strong>${esc(i.title)}</strong><span class="muted">${esc(i.owner || 'To confirm')} · ${esc(i.work_area)}</span></div>`).join('')
      : '<div class="ds-empty"><p class="ds-empty__title">No "Now" priority items</p></div>';

    const openDecisions = decisions.filter((d) => d.status === 'open');
    $('#ov-decisions').innerHTML = openDecisions.length
      ? `<table class="ds-table" style="min-width:0"><thead><tr><th>Decision</th><th>Who decides</th></tr></thead><tbody>${openDecisions.map((d) => `<tr><td class="w-m">${esc(d.text)}</td><td class="w-s">${tbc(d.decider)}</td></tr>`).join('')}</tbody></table>`
      : '<div class="ds-empty"><p class="ds-empty__title">No open decisions</p></div>';

    const today = new Date().toISOString().slice(0, 10);
    const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const overdue = open.filter((i) => i.due_date && i.due_date.slice(0, 10) < today);
    const upcoming = open.filter((i) => i.due_date && i.due_date.slice(0, 10) >= today && i.due_date.slice(0, 10) <= in14);
    const dateRows = overdue.map((i) => rowDate(i, 'danger')).concat(upcoming.map((i) => rowDate(i, 'warning')));
    $('#ov-dates').innerHTML = dateRows.length ? dateRows.join('')
      : '<div class="ds-empty"><p class="ds-empty__title">No due or review dates set</p><p class="ds-empty__reason">Add a due/review date on a work item to see it here.</p></div>';

    const blocked = open.filter((i) => i.status === 'waiting' || (i.blocker && i.blocker.trim()));
    $('#ov-blocked').innerHTML = blocked.length
      ? blocked.map((i) => `<div class="li"><strong>${esc(i.title)}</strong><span class="muted">${esc(i.blocker || 'Waiting')}</span></div>`).join('')
      : '<div class="ds-empty"><p class="ds-empty__title">Nothing marked blocked</p></div>';
  }
  function rowDate(i, tone) {
    return `<div class="li"><div class="row" style="justify-content:space-between"><strong>${esc(i.title)}</strong><span class="ds-badge sm" data-tone="${tone}">${esc(i.due_date ? i.due_date.slice(0, 10) : '')}</span></div><span class="muted">${esc(i.owner || 'To confirm')}</span></div>`;
  }

  // ---------- Filters ----------
  function renderFilters() {
    const owners = Array.from(new Set(workItems.map((i) => i.owner).filter(Boolean))).sort();
    const priorities = Array.from(new Set(workItems.map((i) => i.priority).filter(Boolean))).sort();
    fillSelect($('#f-owner'), ['', ...owners], 'All owners');
    fillSelect($('#f-area'), ['', ...WORK_AREAS], 'All areas');
    fillSelect($('#f-priority'), ['', ...priorities], 'All priorities');
    fillSelect($('#up-area'), ['', ...WORK_AREAS], 'All', true);
  }
  function fillSelect(select, values, allLabel, keepFirst) {
    const current = select.value;
    select.innerHTML = values.map((v, idx) => `<option value="${esc(v)}">${v ? esc(v) : (idx === 0 && !keepFirst ? allLabel : esc(v))}</option>`).join('');
    if (!keepFirst) select.options[0].textContent = allLabel;
    select.value = values.includes(current) ? current : '';
  }
  ['f-owner', 'f-area', 'f-priority'].forEach((id, idx) => {
    const key = ['owner', 'area', 'priority'][idx];
    $('#' + id).addEventListener('change', (e) => { filters[key] = e.target.value; renderBoard(); renderList(); });
  });

  function filteredItems() {
    return workItems.filter((i) =>
      (!filters.owner || i.owner === filters.owner) &&
      (!filters.area || i.work_area === filters.area) &&
      (!filters.priority || i.priority === filters.priority)
    );
  }

  // ---------- Board / list toggle ----------
  $('#view-mode').innerHTML = [['board', 'Board'], ['list', 'List']].map(([v, l]) => `<button class="ds-segmented__item" data-mode="${v}" data-selected="${v === listMode}">${l}</button>`).join('');
  $('#view-mode').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b) return;
    listMode = b.dataset.mode;
    $$('[data-mode]', $('#view-mode')).forEach((x) => (x.dataset.selected = x.dataset.mode === listMode ? 'true' : 'false'));
    $('#board-view').hidden = listMode !== 'board';
    $('#list-view').hidden = listMode !== 'list';
  });

  function itemCardHtml(item) {
    return `<div class="item-card" draggable="true" data-id="${item.id}">
      <div class="title">${esc(item.title)}</div>
      <div class="meta">
        <span class="ds-badge sm" data-tone="neutral">${esc(item.work_area)}</span>
        ${item.priority ? `<span class="ds-badge sm" data-tone="${/^Now/.test(item.priority) ? 'danger' : /^Next/.test(item.priority) ? 'warning' : 'info'}">${esc(item.priority)}</span>` : ''}
        ${item.blocker ? `<span class="ds-badge sm" data-tone="danger"><i data-lucide="octagon-pause"></i>Blocked</span>` : ''}
      </div>
      <div class="owner">${esc(item.owner || 'To confirm')}${item.due_date ? ' · ' + esc(item.due_date.slice(0, 10)) : ''}</div>
    </div>`;
  }

  function renderBoard() {
    const items = filteredItems();
    $('#board').innerHTML = STATUSES.map((status) => {
      const colItems = items.filter((i) => i.status === status).sort((a, b) => a.position - b.position);
      return `<div class="board-col" data-status="${status}">
        <h4>${STATUS_LABEL[status]} <span class="count">${colItems.length}</span></h4>
        ${colItems.map(itemCardHtml).join('')}
      </div>`;
    }).join('');
    wireBoardDnD();
    wireCardOpen();
  }

  function wireCardOpen() {
    $$('.item-card').forEach((card) => {
      card.addEventListener('click', () => openDrawer(Number(card.dataset.id)));
    });
  }

  function wireBoardDnD() {
    let dragId = null;
    $$('.item-card').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        dragId = Number(card.dataset.id);
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
    $$('.board-col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('dragover'); });
      col.addEventListener('dragleave', () => col.classList.remove('dragover'));
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('dragover');
        if (dragId == null) return;
        const status = col.dataset.status;
        const item = workItems.find((i) => i.id === dragId);
        if (!item || item.status === status) return;
        const maxPos = Math.max(0, ...workItems.filter((i) => i.status === status).map((i) => i.position));
        const updated = await api(`/api/work-items/${dragId}`, { method: 'PATCH', body: JSON.stringify({ status, position: maxPos + 1 }) });
        Object.assign(item, updated);
        renderBoard();
        renderList();
        renderOverview();
      });
    });
  }

  function renderList() {
    const items = filteredItems();
    $('#list-table').innerHTML = `<thead><tr><th>Title</th><th>Area</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due</th><th>Next action</th><th></th></tr></thead><tbody>` +
      items.map((i) => `<tr data-id="${i.id}">
        <td class="w-m"><strong>${esc(i.title)}</strong></td>
        <td>${esc(i.work_area)}</td>
        <td class="w-s">${esc(i.owner || 'To confirm')}</td>
        <td>${STATUS_LABEL[i.status]}</td>
        <td class="w-s">${esc(i.priority)}</td>
        <td>${esc(i.due_date ? i.due_date.slice(0, 10) : '—')}</td>
        <td class="w-l">${esc(i.next_action)}</td>
        <td><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-edit="${i.id}">Edit</button></td>
      </tr>`).join('') + `</tbody>`;
    $$('[data-edit]', $('#list-table')).forEach((b) => b.addEventListener('click', () => openDrawer(Number(b.dataset.edit))));
  }

  // ---------- Add / edit drawer ----------
  function fillEditSelects() {
    $('#f-area-edit').innerHTML = WORK_AREAS.map((a) => `<option value="${a}">${a}</option>`).join('');
    $('#f-status-edit').innerHTML = STATUSES.map((s) => `<option value="${s}">${STATUS_LABEL[s]}</option>`).join('');
  }
  fillEditSelects();

  function openDrawer(id) {
    editingId = id || null;
    const item = id ? workItems.find((i) => i.id === id) : null;
    $('#drawer-title').textContent = item ? 'Edit work item' : 'Add work item';
    $('#f-title').value = item ? item.title : '';
    $('#f-area-edit').value = item ? item.work_area : 'BAU';
    $('#f-owner-edit').value = item ? item.owner : '';
    $('#f-status-edit').value = item ? item.status : 'backlog';
    $('#f-priority-edit').value = item ? item.priority : '';
    $('#f-due').value = item && item.due_date ? item.due_date.slice(0, 10) : '';
    $('#f-next').value = item ? item.next_action : '';
    $('#f-deps').value = item ? item.dependencies : '';
    $('#f-tech').value = item ? item.technology : '';
    $('#f-benefit').value = item ? item.expected_benefit : '';
    $('#f-blocker').value = item ? item.blocker : '';
    $('#f-source').value = item ? item.source_context : '';
    $('#delete-item-btn').hidden = !item;
    $('#scrim').classList.add('open');
    $('#item-drawer').classList.add('open');
    icons();
  }
  function closeDrawer() {
    $('#scrim').classList.remove('open');
    $('#item-drawer').classList.remove('open');
    editingId = null;
  }
  $('#add-item-btn').addEventListener('click', () => openDrawer(null));
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#cancel-item-btn').addEventListener('click', closeDrawer);
  $('#scrim').addEventListener('click', closeDrawer);

  $('#item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      title: $('#f-title').value.trim(),
      work_area: $('#f-area-edit').value,
      owner: $('#f-owner-edit').value.trim(),
      status: $('#f-status-edit').value,
      priority: $('#f-priority-edit').value.trim() || 'To confirm',
      due_date: $('#f-due').value || null,
      next_action: $('#f-next').value.trim(),
      dependencies: $('#f-deps').value.trim(),
      technology: $('#f-tech').value.trim(),
      expected_benefit: $('#f-benefit').value.trim(),
      blocker: $('#f-blocker').value.trim(),
      source_context: $('#f-source').value.trim(),
    };
    if (editingId) {
      const updated = await api(`/api/work-items/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      Object.assign(workItems.find((i) => i.id === editingId), updated);
    } else {
      payload.position = Date.now();
      const created = await api('/api/work-items', { method: 'POST', body: JSON.stringify(payload) });
      workItems.push(created);
    }
    closeDrawer();
    renderFilters();
    renderBoard();
    renderList();
    renderOverview();
    renderUpcoming();
    renderRob();
  });

  $('#delete-item-btn').addEventListener('click', async () => {
    if (!editingId) return;
    if (!confirm('Delete this work item? This cannot be undone.')) return;
    await api(`/api/work-items/${editingId}`, { method: 'DELETE' });
    workItems = workItems.filter((i) => i.id !== editingId);
    closeDrawer();
    renderBoard();
    renderList();
    renderOverview();
    renderUpcoming();
    renderRob();
  });

  // ---------- Process (static reference content) ----------
  function renderProcess() {
    $('#sc-now').innerHTML = SCRAM_NOW.map(([t, s]) => `<div class="li">${esc(t)}<span class="src">${esc(s)}</span></div>`).join('');
    $('#sc-issues').innerHTML = SCRAM_ISSUES.map(([h, t, s]) => `<div class="li"><strong>${esc(h)}</strong>${tbc(t)}<span class="src">${esc(s)}</span></div>`).join('');
    $('#sc-next').innerHTML = SCRAM_NEXT.map(([h, t, s]) => `<div class="li"><strong>${esc(h)}</strong><span class="muted">${esc(t)}</span><span class="src">${esc(s)}</span></div>`).join('');

    $('#strip').innerHTML = STAGES.map((s, i) => `${i ? '<span class="ar"><i data-lucide="chevron-right"></i></span>' : ''}
      <a class="st" href="#stage-${i + 1}"><div class="n">Stage ${i + 1}</div><div class="t">${esc(s.name)}</div><div class="o">${tbc(s.owner)}</div></a>`).join('');
    $('#stages').innerHTML = STAGES.map((s, i) => `
      ${i ? '<div class="connector"><i data-lucide="arrow-down"></i></div>' : ''}
      <article class="stage ds-card" id="stage-${i + 1}">
        <div class="stage-h"><span class="stage-n">${i + 1}</span><h3 class="text-title-large-emphasized">${esc(s.name)}</h3></div>
        <div class="stage-g">
          <div><p class="lbl">What happens</p><ul>${s.what.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
          <div><p class="lbl">Who does it now</p>${s.who.map(([n, r]) => `<div class="who ${n === 'To confirm' ? 'tbc' : ''}"><b>${esc(n)}</b> <span class="r">· ${esc(r)}</span></div>`).join('')}
            <p class="lbl" style="margin-top:var(--space-3)">Also involved</p>${s.involved.map(([n, r]) => `<div class="who"><b>${esc(n)}</b> <span class="r">· ${tbc(r)}</span></div>`).join('')}</div>
          <div><p class="lbl">Technology</p><div>${s.tech.map((t) => `<span class="chip-tag">${esc(t)}</span>`).join('')}</div>
            <div class="handoff"><i data-lucide="arrow-right"></i><span><strong>Hands on:</strong> ${tbc(s.handoff)}</span></div></div>
          <div><p class="lbl">Gaps, dependencies and decisions</p>${s.gaps.map((g) => `<div class="gap-li"><i data-lucide="circle-alert"></i><span>${tbc(g)}</span></div>`).join('')}</div>
        </div>
        <p class="src" style="margin:var(--space-3) 0 0">Sources: ${esc(s.src)}</p>
      </article>`).join('');

    let ownFilter = '';
    $('#own-filter').innerHTML = [['', 'All'], ...Object.entries(CHG).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button class="ds-segmented__item" data-of="${k}" data-selected="${k === ''}">${l}</button>`).join('');
    function renderOwn() {
      const rows = OWNX.filter((r) => !ownFilter || r[4] === ownFilter);
      let last = '';
      $('#own-t').innerHTML = `<thead><tr><th>Activity</th><th>Owner now</th><th></th><th>Future owner</th><th>Change</th><th>Status</th></tr></thead><tbody>` +
        rows.map(([g, act, now, fut, c, why, st]) => {
          const head = g !== last ? `<tr><td colspan="6" style="background:color-mix(in srgb,var(--color-on-surface) 4%,var(--color-surface-container-lowest))"><strong>${esc(g)}</strong></td></tr>` : '';
          last = g;
          return head + `<tr><td class="w-m"><strong>${esc(act)}</strong></td><td class="w-m">${tbc(now)}</td><td style="color:var(--color-on-surface-variant)"><i data-lucide="arrow-right"></i></td><td class="w-m">${tbc(fut)}</td><td><span class="ds-badge sm" data-tone="${CHG[c][1]}">${CHG[c][0]}</span></td><td><span class="ds-badge sm" data-tone="${OST[st][1]}">${OST[st][0]}</span></td></tr>`;
        }).join('') + `</tbody>`;
      icons();
    }
    $('#own-filter').addEventListener('click', (e) => {
      const b = e.target.closest('[data-of]');
      if (!b) return;
      ownFilter = b.dataset.of;
      $$('[data-of]', $('#own-filter')).forEach((x) => (x.dataset.selected = x.dataset.of === ownFilter ? 'true' : 'false'));
      renderOwn();
    });
    renderOwn();

    $('#d-it').innerHTML = DANNY_IT.map(([h, t]) => `<div class="li"><strong>${esc(h)}</strong><span class="muted">${esc(t)}</span></div>`).join('');
    $('#d-else').innerHTML = DANNY_ELSE.map(([h, t, o, st]) => `<div class="li"><div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><strong>${esc(h)}</strong><span class="ds-badge sm" data-tone="${st === 'Agreed' ? 'success' : 'warning'}">${esc(st)}</span></div><span class="muted">${esc(t)}</span><div style="margin-top:4px"><i data-lucide="arrow-right"></i> <strong>${esc(o)}</strong></div></div>`).join('');
    const CT = { 'Current cover': 'info', 'Owner to agree': 'warning', 'To confirm': 'warning', 'Handover needed': 'neutral', Agreed: 'success' };
    $('#d-cover').innerHTML = DANNY_COVER.map(([h, t, s]) => `<div class="li"><div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><strong>${esc(h)}</strong><span class="ds-badge sm" data-tone="${CT[s]}">${esc(s)}</span></div><span class="muted">${tbc(t)}</span></div>`).join('');
    $('#d-pmo').innerHTML = `<thead><tr><th>Item</th><th>Lead / resource</th></tr></thead><tbody>` + PMO.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('') + `</tbody>`;

    $('#tc').innerHTML = TO_CONFIRM.map((t) => `<li>${esc(t)}</li>`).join('');
  }

  // ---------- Upcoming work (filters the editable work items) ----------
  function renderUpcoming() {
    const area = $('#up-area').value;
    const groups = {};
    workItems.filter((i) => i.work_area !== 'Other').filter((i) => !area || i.work_area === area).forEach((i) => {
      (groups[i.work_area] = groups[i.work_area] || []).push(i);
    });
    const order = ['SCRAM', 'CEP', 'Deliverability', 'BAU', 'Commercial improvement'];
    $('#upcoming-groups').innerHTML = order.filter((a) => groups[a] && groups[a].length).map((a) => `
      <h3 class="text-title-large-emphasized">${esc(a)}</h3>
      <div class="ds-card tbl-card" style="margin-bottom:var(--space-5)"><div class="ds-table-wrap"><table class="ds-table">
        <thead><tr><th>Item</th><th>Expected to achieve</th><th>Dependencies</th><th>Owner</th><th>Priority</th><th>Benefit evidenced?</th></tr></thead>
        <tbody>${groups[a].sort((x, y) => x.position - y.position).map((i) => `<tr>
          <td class="w-m"><strong>${esc(i.title)}</strong><br><span class="src">${esc(i.source_context)}</span></td>
          <td class="w-l">${esc(i.expected_benefit)}</td>
          <td class="w-s">${tbc(i.dependencies)}</td>
          <td class="w-s">${tbc(i.owner)}</td>
          <td>${esc(i.priority)}</td>
          <td class="w-m">${/evidence|quoted|about £|validated/i.test(i.expected_benefit) && !/not sized|not quantified|not measured|no uplift/i.test(i.expected_benefit) ? '<span class="ds-badge sm" data-tone="success">Some evidence</span>' : '<span class="ds-badge sm" data-tone="warning">Needs validating</span>'}</td>
        </tr>`).join('')}</tbody>
      </table></div></div>`).join('') || '<div class="ds-empty"><p class="ds-empty__title">No items match this filter</p></div>';
  }
  $('#up-area').addEventListener('change', renderUpcoming);

  // ---------- Meetings (static) ----------
  function renderMeetings() {
    const dt = (s) => (s.startsWith('Available') ? (s === 'Available' ? 'success' : 'info') : 'warning');
    $('#meetings').innerHTML = [[MEET_PERF, 'trending-up'], [MEET_OPS, 'activity']].map(([m, ic]) => `
      <div class="ds-card pad">
        <div class="card-h"><span class="ds-icon-tile"><i data-lucide="${ic}"></i></span><div><h3 class="text-title-large-emphasized">${esc(m.title)}</h3><p class="muted text-body-small" style="margin:2px 0 0">${esc(m.cadence)}</p></div></div>
        <p class="lbl">Agenda</p><ol class="tight text-body-medium">${m.agenda.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
        <p class="lbl" style="margin-top:var(--space-4)">Measures</p>
        <div class="ds-table-wrap"><table class="ds-table" style="min-width:0"><thead><tr><th>Measure</th><th>Why</th><th>Data</th></tr></thead><tbody>
          ${m.measures.map(([a, b, c]) => {
            const i = c.indexOf(' (');
            const sc = c.indexOf(';');
            const cut = [i, sc].filter((x) => x > 0);
            const k = cut.length ? Math.min(...cut) : -1;
            const lab = k > 0 ? c.slice(0, k) : c;
            const note = k > 0 ? c.slice(k).replace(/^[;\s(]+|\)$/g, '') : '';
            return `<tr><td class="w-s"><strong>${esc(a)}</strong></td><td>${esc(b)}</td><td class="w-s"><span class="ds-badge sm" data-tone="${dt(lab)}">${esc(lab)}</span>${note ? `<div class="src" style="margin-top:4px">${esc(note)}</div>` : ''}</td></tr>`;
          }).join('')}
        </tbody></table></div>
      </div>`).join('');
  }

  // ---------- For Rob ----------
  function renderRob() {
    const open = workItems.filter((i) => i.status !== 'done');
    const priority = open.filter((i) => /^Now/.test(i.priority)).slice(0, 5);
    $('#rob-priority').innerHTML = priority.length
      ? `<ol class="tight text-body-medium">${priority.map((i) => `<li><strong>${esc(i.title)}</strong> — ${esc(i.owner || 'To confirm')}</li>`).join('')}</ol>`
      : '<div class="ds-empty"><p class="ds-empty__title">No "Now" items set</p></div>';

    const risks = SCRAM_ISSUES.slice(0, 4).map(([h, t]) => [h, t]).concat(
      open.filter((i) => i.blocker && i.blocker.trim()).map((i) => [i.title, i.blocker])
    );
    $('#rob-risks').innerHTML = risks.length
      ? risks.map(([h, t]) => `<div class="li"><strong>${esc(h)}</strong><span class="muted">${tbc(t)}</span></div>`).join('')
      : '<div class="ds-empty"><p class="ds-empty__title">No material risks flagged</p></div>';

    const openDecisions = decisions.filter((d) => d.status === 'open');
    $('#rob-dec-t').innerHTML = `<thead><tr><th>Decision</th><th>Who decides</th></tr></thead><tbody>` +
      (openDecisions.length ? openDecisions.map((d) => `<tr><td class="w-l">${esc(d.text)}</td><td class="w-s">${tbc(d.decider)}</td></tr>`).join('') : `<tr><td colspan="2" class="muted">No open decisions</td></tr>`) +
      `</tbody>`;
  }

  checkAuth();
})();
