// Accessible form logic — plain JavaScript, no libraries.
const form = document.getElementById('apply-form');
const summary = document.getElementById('error-summary');
const list = document.getElementById('error-list');
const status = document.getElementById('status');
const thisYear = new Date().getFullYear();

// 1. One rule per field. Return an error message, or "" when valid.
const rules = {
  name:      v => !v.trim() ? 'Enter your full name.' :
                  v.trim().length < 2 ? 'Name must be at least 2 characters.' : '',
  email:     v => !v.trim() ? 'Enter your email address.' :
                  !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Enter a valid email, like name@example.com.' : '',
  phone:     v => !v.trim() ? 'Enter your phone number.' :
                  v.replace(/[\s-]/g, '').replace(/^\+?91/, '').match(/^\d{10}$/) ? '' : 'Phone number must have 10 digits.',
  education: v => v ? '' : 'Select your highest qualification.',
  school:    v => v.trim() ? '' : 'Enter your school or university.',
  year:      v => !v.trim() ? 'Enter your graduation year.' :
                  !/^\d{4}$/.test(v.trim()) ? 'Enter the year as 4 digits, like 2026.' :
                  (+v < 1980 || +v > thisYear + 6) ? `Enter a year between 1980 and ${thisYear + 6}.` : '',
  consent:   (v, el) => el.checked ? '' : 'Tick the box to agree before submitting.'
};
const fieldIds = Object.keys(rules);
const label = id => document.querySelector(`label[for="${id}"]`).childNodes[0].textContent.trim();

// 2. Show or clear the error for one field.
function validate(id) {
  const el = document.getElementById(id);
  const msg = rules[id](el.value, el);
  const out = document.getElementById(id + '-error');
  out.textContent = msg;
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  el.classList.toggle('valid', !msg && el.value !== '' || (!msg && el.checked));
  return msg;
}

// 3. Progress (visual only).
function updateProgress() {
  const done = fieldIds.filter(id => {
    const el = document.getElementById(id);
    return !rules[id](el.value, el);
  }).length;
  document.getElementById('bar').style.width = (done / fieldIds.length * 100) + '%';
  document.getElementById('progress-text').textContent = `${done} of ${fieldIds.length} required fields complete`;
}

// 4. Validate when leaving a field; once it has an error, re-check while typing.
fieldIds.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => validate(id));
  const live = () => { if (el.getAttribute('aria-invalid') === 'true') validate(id); updateProgress(); };
  el.addEventListener('input', live);
  el.addEventListener('change', live);
});

// 5. Character counter. Announce only at a few thresholds to avoid noisy speech.
const note = document.getElementById('note');
const count = document.getElementById('note-count');
note.addEventListener('input', () => {
  const left = 300 - note.value.length;
  count.textContent = `${left} characters left`;
  if ([100, 50, 10, 0].includes(left)) status.textContent = `${left} characters left`;
});

// 6. Submit: validate everything, build the summary, move focus to it.
form.addEventListener('submit', e => {
  e.preventDefault();
  const errors = fieldIds.map(id => [id, validate(id)]).filter(([, m]) => m);

  if (errors.length) {
    document.getElementById('error-title').textContent =
      `There ${errors.length === 1 ? 'is 1 problem' : 'are ' + errors.length + ' problems'} with your application`;
    list.innerHTML = '';
    errors.forEach(([id, msg]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = `${label(id === 'consent' ? 'consent' : id).replace('I agree that Brightpath Labs may store my details for this application.', 'Agreement')}: ${msg}`;
      a.addEventListener('click', ev => { ev.preventDefault(); document.getElementById(id).focus(); });
      li.appendChild(a);
      list.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
    return;
  }

  summary.hidden = true;
  form.hidden = true;
  document.querySelector('.progress').hidden = true;
  const first = document.getElementById('name').value.trim().split(' ')[0];
  document.getElementById('success-msg').textContent =
    `Thank you, ${first}. We've sent a confirmation to ${document.getElementById('email').value.trim()}.`;
  const ok = document.getElementById('success');
  ok.hidden = false;
  ok.focus();
});

// 7. Reset the whole flow.
document.getElementById('again').addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  document.querySelector('.progress').hidden = false;
  document.getElementById('success').hidden = true;
  form.querySelectorAll('[aria-invalid], .valid').forEach(el => { el.removeAttribute('aria-invalid'); el.classList.remove('valid'); });
  form.querySelectorAll('.error').forEach(p => p.textContent = '');
  count.textContent = '300 characters left';
  updateProgress();
  document.getElementById('name').focus();
});

// 8. Text-size buttons.
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.body.className = btn.dataset.size === 'normal' ? '' : btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach(b => b.setAttribute('aria-pressed', b === btn));
  });
});

updateProgress();
