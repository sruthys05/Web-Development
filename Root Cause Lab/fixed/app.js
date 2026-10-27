const $ = id => document.getElementById(id);
let timer;

// FIX 06 + 18: real buttons, message goes to the role="status" region
document.querySelectorAll('[data-name]').forEach(btn =>
  btn.addEventListener('click', () => {
    $('toast').textContent = btn.dataset.name + ' added to cart';
    clearTimeout(timer);
    timer = setTimeout(() => ($('toast').textContent = ''), 4000);
  })
);

// FIX 17: keep aria-expanded in sync
$('acc-btn').addEventListener('click', () => {
  const open = $('acc-btn').getAttribute('aria-expanded') === 'true';
  $('acc-btn').setAttribute('aria-expanded', String(!open));
  $('acc-body').hidden = open;
});

// FIX 08: native dialog handles Esc, focus trap and focus return
$('open-offer').addEventListener('click', () => $('offer').showModal());
$('close').addEventListener('click', () => $('offer').close());
$('claim').addEventListener('click', () => ($('m-msg').textContent = 'Offer sent!'));

// FIX 14: text error, aria-invalid, focus moves to the field
$('news').addEventListener('submit', e => {
  e.preventDefault();
  const ok = /^\S+@\S+\.\S+$/.test($('email').value);
  $('email-err').hidden = ok;
  $('email').setAttribute('aria-invalid', String(!ok));
  if (!ok) $('email').focus();
});
