const $ = id => document.getElementById(id);

function add(name) {
  $('toast').textContent = name + ' added to cart';
  setTimeout(() => ($('toast').textContent = ''), 4000);
}

function toggleAcc() {
  $('acc-body').hidden = !$('acc-body').hidden;
}

function openOffer() {
  $('modal').hidden = false;
  $('m-email').focus();
}
function closeOffer() { $('modal').hidden = true; }
function claim() { $('m-msg').textContent = 'Offer sent!'; }

// Keeps Tab inside the popup. There is no keyboard way out.
$('modal').addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const items = [...$('modal').querySelectorAll('input,button')];
  const i = items.indexOf(document.activeElement);
  items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
});

$('news').addEventListener('submit', e => {
  e.preventDefault();
  if (!/^\S+@\S+\.\S+$/.test($('email').value)) $('email').classList.add('bad');
  else $('email').classList.remove('bad');
});
