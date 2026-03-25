/* ===================================================
   GoToKart — script.js   (corrected)
   Key fixes:
   1. JWT-based login via POST /auth/login (not GET /users)
   2. Authorization: Bearer <token> on every protected request
   3. Dynamic category loading from /api/categories
   4. Admin role detection → show/hide delete & add-product UI
   5. Category passed with new products
   6. Cart badge shows total item quantity (not just item count)
   7. changeCartQty uses PATCH/PUT if available, fallback safe
   8. registerUser endpoint aligned to /auth/register
   =================================================== */

const API = 'https://backend-production-e13e2.up.railway.app/api';

let currentUser  = null;   // { id, name, email, role }
let jwtToken     = localStorage.getItem('gk_token') || null;
let allProducts  = [];
let allCategories = [];
let activeCategory = 'all';  // category id (number) or 'all'
let activeSearch   = '';

/* ─── JWT HELPER ──────────────────────────────────────── */
function authHeaders() {
  return jwtToken
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` }
    : { 'Content-Type': 'application/json' };
}

/* ─── CATEGORY DETECTION (fallback for un-categorised products) ─── */
function getCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('phone') || n.includes('laptop') || n.includes('computer') || n.includes('tablet') ||
      n.includes('tv') || n.includes('television') || n.includes('camera') || n.includes('headphone') ||
      n.includes('earphone') || n.includes('speaker') || n.includes('keyboard') || n.includes('mouse') ||
      n.includes('charger') || n.includes('battery') || n.includes('powerbank') || n.includes('printer') ||
      n.includes('router') || n.includes('pendrive') || n.includes('hard disk') || n.includes('monitor') ||
      n.includes('iphone') || n.includes('samsung') || n.includes('macbook') || n.includes('airpod') ||
      n.includes('gaming') || n.includes('cable') || n.includes('wifi') || n.includes('modem') ||
      n.includes('ssd') || n.includes('smartwatch') || n.includes('drone') || n.includes('projector')) return 'electronics';
  if (n.includes('shirt') || n.includes('pant') || n.includes('trouser') || n.includes('jeans') ||
      n.includes('dress') || n.includes('jacket') || n.includes('coat') || n.includes('hoodie') ||
      n.includes('sweater') || n.includes('saree') || n.includes('suit') || n.includes('kurta') ||
      n.includes('shorts') || n.includes('sock') || n.includes('glove') || n.includes('scarf') ||
      n.includes('tshirt') || n.includes('top') || n.includes('blazer') || n.includes('kurti') ||
      n.includes('denim') || n.includes('legging') || n.includes('innerwear') || n.includes('bra') ||
      n.includes('hat') || n.includes('cap') || n.includes('beanie') || n.includes('shawl') ||
      n.includes('dupatta') || n.includes('salwar') || n.includes('pajama') || n.includes('sweatshirt')) return 'clothing';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('boot') || n.includes('heel') ||
      n.includes('sandal') || n.includes('slipper') || n.includes('loafer') || n.includes('chappal') ||
      n.includes('flipflop') || n.includes('flip flop') || n.includes('trainer') ||
      n.includes('oxford') || n.includes('footwear') || n.includes('moccasin')) return 'footwear';
  if (n.includes('goggle') || n.includes('sunglasses') || n.includes('glasses') || n.includes('watch') ||
      n.includes('ring') || n.includes('necklace') || n.includes('earring') || n.includes('bracelet') ||
      n.includes('belt') || n.includes('wallet') || n.includes('bag') || n.includes('backpack') ||
      n.includes('purse') || n.includes('umbrella') || n.includes('tie') || n.includes('bangle') ||
      n.includes('pendant') || n.includes('chain') || n.includes('jewel') || n.includes('chasma') ||
      n.includes('spectacle') || n.includes('handbag') || n.includes('clutch') || n.includes('suitcase') ||
      n.includes('luggage') || n.includes('locket') || n.includes('anklet')) return 'accessories';
  if (n.includes('nail') || n.includes('lipstick') || n.includes('lip') || n.includes('perfume') ||
      n.includes('cologne') || n.includes('deodorant') || n.includes('deo') || n.includes('makeup') ||
      n.includes('mascara') || n.includes('eyeliner') || n.includes('kajal') || n.includes('foundation') ||
      n.includes('blush') || n.includes('shampoo') || n.includes('conditioner') || n.includes('hair oil') ||
      n.includes('soap') || n.includes('facewash') || n.includes('face wash') || n.includes('moisturizer') ||
      n.includes('cream') || n.includes('lotion') || n.includes('toothbrush') || n.includes('toothpaste') ||
      n.includes('razor') || n.includes('trimmer') || n.includes('serum') || n.includes('sunscreen') ||
      n.includes('toner') || n.includes('sanitizer') || n.includes('body wash') || n.includes('bodywash') ||
      n.includes('face mask') || n.includes('hair dryer') || n.includes('straightener') ||
      n.includes('highlighter') || n.includes('concealer') || n.includes('primer')) return 'beauty';
  if (n.includes('cricket') || n.includes('football') || n.includes('basketball') || n.includes('gym') ||
      n.includes('dumbbell') || n.includes('yoga') || n.includes('cycle') || n.includes('bicycle') ||
      n.includes('badminton') || n.includes('tennis') || n.includes('swimming') || n.includes('protein') ||
      n.includes('supplement') || n.includes('fitness') || n.includes('sports') || n.includes('weight') ||
      n.includes('barbell') || n.includes('skipping') || n.includes('treadmill') || n.includes('racket') ||
      n.includes('volleyball') || n.includes('hockey') || n.includes('boxing') || n.includes('gloves') ||
      n.includes('bat') || n.includes('stumps') || n.includes('jersey')) return 'sports';
  if (n.includes('chair') || n.includes('sofa') || n.includes('bed') || n.includes('mattress') ||
      n.includes('pillow') || n.includes('blanket') || n.includes('lamp') || n.includes('bulb') ||
      n.includes('light') || n.includes('led') || n.includes('fan') || n.includes('cooler') ||
      n.includes('ac ') || n.includes(' ac') || n === 'ac' || n.includes('air conditioner') ||
      n.includes('fridge') || n.includes('refrigerator') || n.includes('washing machine') ||
      n.includes('vacuum') || n.includes('broom') || n.includes('bucket') || n.includes('mirror') ||
      n.includes('clock') || n.includes('candle') || n.includes('curtain') || n.includes('towel') ||
      n.includes('furniture') || n.includes('decor') || n.includes('home') || n.includes('geyser') ||
      n.includes('microwave') || n.includes('oven') || n.includes('mixer') || n.includes('grinder') ||
      n.includes('juicer') || n.includes('toaster') || n.includes('iron') || n.includes('inverter') ||
      n.includes('heater') || n.includes('air purifier') || n.includes('dishwasher') || n.includes('kettle') ||
      n.includes('induction') || n.includes('chimney') || n.includes('exhaust')) return 'home';
  if (n.includes('rice') || n.includes('wheat') || n.includes('flour') || n.includes('atta') ||
      n.includes('milk') || n.includes('coffee') || n.includes('tea') || n.includes('juice') ||
      n.includes('chocolate') || n.includes('biscuit') || n.includes('snack') || n.includes('chips') ||
      n.includes('oil') || n.includes('ghee') || n.includes('spice') || n.includes('masala') ||
      n.includes('fruit') || n.includes('vegetable') || n.includes('food') || n.includes('dal') ||
      n.includes('sugar') || n.includes('salt') || n.includes('sauce') || n.includes('pickle') ||
      n.includes('bread') || n.includes('butter') || n.includes('cheese') || n.includes('egg') ||
      n.includes('paneer') || n.includes('honey') || n.includes('jam') || n.includes('noodle') ||
      n.includes('pasta') || n.includes('namkeen') || n.includes('dry fruit') || n.includes('nuts')) return 'food';
  if (n.includes('book') || n.includes('novel') || n.includes('textbook') || n.includes('pen') ||
      n.includes('pencil') || n.includes('notebook') || n.includes('diary') || n.includes('stationery') ||
      n.includes('marker') || n.includes('eraser') || n.includes('calculator') || n.includes('ruler') ||
      n.includes('stapler') || n.includes('file') || n.includes('folder') || n.includes('compass')) return 'books';
  if (n.includes('toy') || n.includes('doll') || n.includes('lego') || n.includes('puzzle') ||
      n.includes('game') || n.includes('playstation') || n.includes('xbox') || n.includes('nintendo') ||
      n.includes('remote control') || n.includes('teddy') || n.includes('board game') ||
      n.includes('chess') || n.includes('carrom') || n.includes('action figure')) return 'toys';
  return 'other';
}

/* ─── EMOJI MAP ───────────────────────────────────────── */
function productEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('iphone') || n.includes('smartphone')) return '📱';
  if (n.includes('phone') || n.includes('mobile')) return '📱';
  if (n.includes('laptop') || n.includes('macbook')) return '💻';
  if (n.includes('computer') || n.includes('pc') || n.includes('desktop')) return '🖥️';
  if (n.includes('tablet') || n.includes('ipad')) return '📟';
  if (n.includes('headphone') || n.includes('earphone') || n.includes('airpod')) return '🎧';
  if (n.includes('speaker')) return '🔊';
  if (n.includes('camera')) return '📷';
  if (n.includes('tv') || n.includes('television') || n.includes('monitor')) return '📺';
  if (n.includes('keyboard')) return '⌨️';
  if (n.includes('mouse')) return '🖱️';
  if (n.includes('charger') || n.includes('cable')) return '🔌';
  if (n.includes('battery') || n.includes('powerbank')) return '🔋';
  if (n.includes('printer')) return '🖨️';
  if (n.includes('projector')) return '📽️';
  if (n.includes('drone')) return '🚁';
  if (n.includes('shirt') || n.includes('tshirt') || n.includes('top')) return '👕';
  if (n.includes('pant') || n.includes('trouser') || n.includes('jeans') || n.includes('denim')) return '👖';
  if (n.includes('dress') || n.includes('frock') || n.includes('gown')) return '👗';
  if (n.includes('jacket') || n.includes('coat') || n.includes('hoodie') || n.includes('sweater') || n.includes('sweatshirt')) return '🧥';
  if (n.includes('saree') || n.includes('sari')) return '🥻';
  if (n.includes('suit') || n.includes('blazer')) return '🤵';
  if (n.includes('kurta') || n.includes('kurti')) return '👘';
  if (n.includes('shorts')) return '🩳';
  if (n.includes('sock')) return '🧦';
  if (n.includes('glove')) return '🧤';
  if (n.includes('scarf') || n.includes('shawl') || n.includes('dupatta')) return '🧣';
  if (n.includes('hat') || n.includes('cap') || n.includes('beanie')) return '🧢';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('trainer')) return '👟';
  if (n.includes('boot')) return '🥾';
  if (n.includes('heel') || n.includes('stiletto')) return '👠';
  if (n.includes('sandal') || n.includes('slipper') || n.includes('chappal') || n.includes('flip flop') || n.includes('flipflop')) return '🩴';
  if (n.includes('loafer') || n.includes('oxford') || n.includes('moccasin')) return '👞';
  if (n.includes('goggle') || n.includes('sunglasses') || n.includes('glasses') || n.includes('spectacle')) return '🕶️';
  if (n.includes('watch')) return '⌚';
  if (n.includes('ring')) return '💍';
  if (n.includes('necklace') || n.includes('chain') || n.includes('pendant') || n.includes('locket')) return '📿';
  if (n.includes('earring')) return '💎';
  if (n.includes('bracelet') || n.includes('bangle') || n.includes('anklet')) return '📿';
  if (n.includes('belt')) return '🪢';
  if (n.includes('wallet') || n.includes('purse')) return '👛';
  if (n.includes('handbag') || n.includes('clutch')) return '👜';
  if (n.includes('backpack') || n.includes('rucksack')) return '🎒';
  if (n.includes('bag')) return '🛍️';
  if (n.includes('umbrella')) return '☂️';
  if (n.includes('luggage') || n.includes('suitcase')) return '🧳';
  if (n.includes('lipstick') || n.includes('lip gloss') || n.includes('lip balm')) return '💄';
  if (n.includes('perfume') || n.includes('cologne') || n.includes('deo') || n.includes('deodorant')) return '🧴';
  if (n.includes('shampoo') || n.includes('conditioner') || n.includes('hair oil') || n.includes('hair')) return '🧴';
  if (n.includes('soap') || n.includes('facewash') || n.includes('face wash') || n.includes('body wash')) return '🧼';
  if (n.includes('moisturizer') || n.includes('cream') || n.includes('lotion') || n.includes('serum') || n.includes('sunscreen')) return '🧴';
  if (n.includes('toothbrush') || n.includes('toothpaste')) return '🪥';
  if (n.includes('razor') || n.includes('trimmer')) return '🪒';
  if (n.includes('book') || n.includes('novel') || n.includes('textbook')) return '📚';
  if (n.includes('pen') || n.includes('pencil') || n.includes('marker')) return '✏️';
  if (n.includes('notebook') || n.includes('diary') || n.includes('journal')) return '📓';
  if (n.includes('cricket') || n.includes('bat') || n.includes('stumps')) return '🏏';
  if (n.includes('football') || n.includes('soccer')) return '⚽';
  if (n.includes('basketball')) return '🏀';
  if (n.includes('badminton') || n.includes('racket')) return '🏸';
  if (n.includes('tennis')) return '🎾';
  if (n.includes('gym') || n.includes('dumbbell') || n.includes('weight') || n.includes('barbell')) return '🏋️';
  if (n.includes('yoga')) return '🧘';
  if (n.includes('cycle') || n.includes('bicycle')) return '🚲';
  if (n.includes('treadmill')) return '🏃';
  if (n.includes('ac ') || n.includes(' ac') || n === 'ac' || n.includes('air conditioner')) return '❄️';
  if (n.includes('fridge') || n.includes('refrigerator')) return '🧊';
  if (n.includes('washing machine') || n.includes('washer')) return '🫧';
  if (n.includes('microwave') || n.includes('oven')) return '📦';
  if (n.includes('geyser') || n.includes('water heater')) return '🚿';
  if (n.includes('fan') || n.includes('cooler')) return '💨';
  if (n.includes('heater')) return '🔥';
  if (n.includes('chair') || n.includes('sofa') || n.includes('couch')) return '🪑';
  if (n.includes('bed') || n.includes('mattress') || n.includes('pillow')) return '🛏️';
  if (n.includes('blanket') || n.includes('quilt')) return '🛌';
  if (n.includes('lamp') || n.includes('bulb') || n.includes('led') || n.includes('light')) return '💡';
  if (n.includes('clock') || n.includes('alarm')) return '⏰';
  if (n.includes('mirror')) return '🪞';
  if (n.includes('toy') || n.includes('doll') || n.includes('teddy')) return '🧸';
  if (n.includes('playstation') || n.includes('xbox') || n.includes('nintendo')) return '🎮';
  if (n.includes('puzzle') || n.includes('jigsaw')) return '🧩';
  if (n.includes('chess') || n.includes('board game') || n.includes('carrom')) return '♟️';
  if (n.includes('milk') || n.includes('paneer')) return '🥛';
  if (n.includes('coffee')) return '☕';
  if (n.includes('tea') || n.includes('chai')) return '🍵';
  if (n.includes('juice') || n.includes('drink')) return '🧃';
  if (n.includes('chocolate') || n.includes('candy')) return '🍫';
  if (n.includes('biscuit') || n.includes('cookie')) return '🍪';
  if (n.includes('chips') || n.includes('snack') || n.includes('namkeen')) return '🍟';
  if (n.includes('rice') || n.includes('wheat') || n.includes('atta') || n.includes('flour')) return '🌾';
  if (n.includes('fruit') || n.includes('apple') || n.includes('mango') || n.includes('banana')) return '🍎';
  if (n.includes('vegetable') || n.includes('veggie')) return '🥦';
  if (n.includes('bread')) return '🍞';
  if (n.includes('butter') || n.includes('cheese')) return '🧀';
  if (n.includes('egg')) return '🥚';
  if (n.includes('honey')) return '🍯';
  if (n.includes('noodle') || n.includes('pasta')) return '🍜';
  if (n.includes('dry fruit') || n.includes('nuts') || n.includes('almond') || n.includes('cashew')) return '🥜';
  if (n.includes('spice') || n.includes('masala')) return '🌶️';
  return '📦';
}

/* ─── SPINNER ─────────────────────────────────────────── */
function showSpinner(msg = 'Loading...') {
  document.getElementById('spinnerText').textContent = msg;
  document.getElementById('spinnerOverlay').classList.remove('hidden');
}
function hideSpinner() { document.getElementById('spinnerOverlay').classList.add('hidden'); }

/* ─── TOAST ───────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

/* ─── ORDER MODAL ─────────────────────────────────────── */
function showOrderModal(orderId, total) {
  document.getElementById('modalMsg').innerHTML =
    `Your Order <strong>#${orderId}</strong> placed successfully!<br>
     Total: <strong style="color:var(--accent)">₹${(total || 0).toLocaleString('en-IN')}</strong>`;
  document.getElementById('orderModal').classList.remove('hidden');
}
function closeOrderModal() {
  document.getElementById('orderModal').classList.add('hidden');
  showSection('products');
}

/* ─── NAVIGATION ──────────────────────────────────────── */
function showSection(name) {
  ['hero', 'auth', 'products', 'cart', 'orders'].forEach(s => {
    const el = document.getElementById(s + 'Section');
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById(name + 'Section');
  if (target) target.classList.remove('hidden');

  if (name === 'products') { loadProducts(); document.getElementById('navShop').classList.add('active'); }
  if (name === 'cart')     { loadCart();     document.getElementById('navCart').classList.add('active'); }
  if (name === 'orders')   { loadOrders();   document.getElementById('navOrders').classList.add('active'); }
  if (name === 'auth')     { document.getElementById('authLink').classList.add('active'); }
}

/* ─── AUTH TAB ────────────────────────────────────────── */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('loginForm').classList.remove('hidden');
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('registerForm').classList.remove('hidden');
  }
}

/* ─── LOGIN — uses POST /auth/login + JWT ─────────────── */
function loginUser() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!email || !password) return toast('Please enter email and password', 'error');

  showSpinner('Logging you in...');
  fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(r => {
      if (!r.ok) return r.text().then(t => { throw new Error(t || 'Invalid credentials'); });
      return r.json();
    })
    .then(data => {
      hideSpinner();
      // Backend returns { token, id, name, email, role }
      jwtToken = data.token;
      localStorage.setItem('gk_token', jwtToken);
      currentUser = { id: data.id, name: data.name, email: data.email, role: data.role };
      onLoginSuccess();
    })
    .catch(err => { hideSpinner(); toast(err.message || 'Login failed.', 'error'); });
}

function onLoginSuccess() {
  document.getElementById('authLink').textContent = currentUser.name || `User #${currentUser.id}`;
  document.getElementById('authLink').onclick = (e) => e.preventDefault();
  document.getElementById('logoutBtn').classList.remove('hidden');
  updateCartBadge();
  // FIX: show "Add Product" button only if ADMIN
  const isAdmin = (currentUser.role || '').toUpperCase() === 'ADMIN';
  document.getElementById('adminToggleBtn').classList.toggle('hidden', !isAdmin);
  toast(`Welcome back, ${currentUser.name || 'User'}! 👋`);
  showSection('products');
}

/* ─── REGISTER — POST /auth/register ─────────────────── */
function registerUser() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  if (!name || !email || !password) return toast('Please fill all fields', 'error');

  showSpinner('Creating your account...');
  fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t || 'Registration failed'); }); return r.json(); })
    .then(() => {
      hideSpinner();
      toast(`Account created! Welcome, ${name}! 🎉`);
      ['regName','regEmail','regPassword'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = password;
      switchAuthTab('login');
    })
    .catch(err => { hideSpinner(); toast(err.message || 'Registration failed.', 'error'); });
}

/* ─── LOGOUT ──────────────────────────────────────────── */
function logoutUser() {
  currentUser = null;
  jwtToken = null;
  localStorage.removeItem('gk_token');
  document.getElementById('authLink').textContent = 'Login';
  document.getElementById('authLink').onclick = () => showSection('auth');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('cartBadge').textContent = '0';
  document.getElementById('adminToggleBtn').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  toast('Logged out successfully 👋');
  showSection('hero');
}

/* ─── CATEGORIES — dynamic from backend ──────────────── */
function loadCategories() {
  fetch(`${API}/categories`, { headers: authHeaders() })
    .then(r => r.json())
    .then(cats => {
      allCategories = cats || [];
      renderCategoryBar(allCategories);
      populateCategoryDropdown(allCategories);
    })
    .catch(() => { /* silent: category bar keeps "All" */ });
}

const CATEGORY_EMOJI = {
  electronics: '📱', clothing: '👕', footwear: '👟', accessories: '🕶️',
  beauty: '💄', sports: '🏋️', home: '🏠', food: '🍎', books: '📚', toys: '🧸'
};

function renderCategoryBar(cats) {
  const bar = document.getElementById('categoriesBar');
  // Keep the "All" button, replace the rest
  bar.innerHTML = `<button class="cat-btn active" onclick="filterByCategory('all')" data-cat="all">🛍️ All</button>`;
  cats.forEach(c => {
    const emoji = CATEGORY_EMOJI[c.name.toLowerCase()] || '🏷️';
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = c.id;
    btn.textContent = `${emoji} ${c.name}`;
    btn.onclick = () => filterByCategory(c.id);
    bar.appendChild(btn);
  });
}

function populateCategoryDropdown(cats) {
  const sel = document.getElementById('pCategory');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select Category —</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

/* ─── PRODUCTS ────────────────────────────────────────── */
function loadProducts() {
  showSpinner('Fetching products...');
  fetch(`${API}/products`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
    .then(products => {
      hideSpinner();
      allProducts = products;
      applyFilters();
    })
    .catch(() => { hideSpinner(); toast('Could not load products', 'error'); });
}

function filterByCategory(catId) {
  activeCategory = catId;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', String(b.dataset.cat) === String(catId));
  });
  applyFilters();
}

function filterProducts() {
  activeSearch = document.getElementById('searchInput').value.trim().toLowerCase();
  document.getElementById('searchClear').classList.toggle('hidden', !activeSearch);
  applyFilters();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  activeSearch = '';
  document.getElementById('searchClear').classList.add('hidden');
  document.getElementById('searchResultInfo').classList.add('hidden');
  applyFilters();
}

function applyFilters() {
  let filtered = [...allProducts];

  // FIX: filter by backend category id (not keyword matching) when a real category is selected
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category && String(p.category.id) === String(activeCategory));
  }

  if (activeSearch) {
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(activeSearch) ||
      (p.description || '').toLowerCase().includes(activeSearch)
    );
  }

  const stockFilter = document.getElementById('stockFilter')?.value;
  if (stockFilter === 'instock')  filtered = filtered.filter(p => (p.stock || 0) > 0);
  if (stockFilter === 'outstock') filtered = filtered.filter(p => (p.stock || 0) <= 0);

  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price-low')  filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'price-high') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === 'name-az')    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (sort === 'name-za')    filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  if (sort === 'stock-high') filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));

  const info = document.getElementById('searchResultInfo');
  if (activeSearch) {
    info.classList.remove('hidden');
    info.innerHTML = filtered.length
      ? `Showing <span>${filtered.length}</span> result${filtered.length !== 1 ? 's' : ''} for "<span>${activeSearch}</span>"`
      : `No results for "<span>${activeSearch}</span>"`;
  } else {
    info.classList.add('hidden');
  }

  const countEl = document.getElementById('productsCount');
  if (countEl) countEl.innerHTML = `<span>${filtered.length}</span> product${filtered.length !== 1 ? 's' : ''}`;

  renderProducts(filtered);
}

function highlight(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return (text || '').replace(regex, '<mark style="background:rgba(245,166,35,0.3);color:var(--accent);border-radius:2px;padding:0 2px">$1</mark>');
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  const isAdmin = currentUser && (currentUser.role || '').toUpperCase() === 'ADMIN';

  if (!products.length) {
    grid.innerHTML = `<div class="no-results">
      <span class="no-results-emoji">🔍</span>
      <p>No products found</p>
      <p style="font-size:0.8rem;margin-top:0.5rem;color:var(--text2)">Try a different category or search term</p>
    </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.03}s">
      <span class="product-emoji">${productEmoji(p.name)}</span>
      ${p.category ? `<span class="product-category-tag">${p.category.name}</span>` : ''}
      <div class="product-name">${highlight(p.name || 'Unnamed', activeSearch)}</div>
      <div class="product-desc">${highlight(p.description || 'No description', activeSearch)}</div>
      <div class="product-footer">
        <div class="product-price">₹${(p.price || 0).toLocaleString('en-IN')}</div>
        <div class="product-stock ${(p.stock || 0) <= 5 ? 'low' : ''}">
          ${p.stock <= 0 ? '❌ Out of stock' : p.stock <= 5 ? `⚠️ Only ${p.stock} left` : `${p.stock} in stock`}
        </div>
      </div>
      <div class="qty-row">
        <input type="number" class="qty-input" id="qty-${p.id}" value="1" min="1" max="${p.stock || 99}" ${p.stock <= 0 ? 'disabled' : ''}/>
        <button class="btn-cart" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Out of Stock' : '🛒 Add'}</button>
      </div>
      ${isAdmin ? `
      <div class="product-actions">
        <button class="btn-delete-product" onclick="deleteProduct(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}')">🗑️ Remove Product</button>
      </div>` : ''}
    </div>
  `).join('');
}

/* ─── DELETE PRODUCT (admin only, sends JWT) ──────────── */
function deleteProduct(productId, productName) {
  if (!confirm(`Remove "${productName}" from the store?`)) return;
  showSpinner('Removing product...');
  fetch(`${API}/products/${productId}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
    .then(r => {
      hideSpinner();
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast(`"${productName}" removed ✅`);
      loadProducts();
      loadCategories();  // category may have been auto-deleted
    })
    .catch(err => { hideSpinner(); toast('Failed to remove: ' + err.message, 'error'); });
}

function toggleAdminPanel() {
  document.getElementById('adminPanel').classList.toggle('hidden');
}

/* ─── ADD PRODUCT (admin only) ─── sends JWT + category ── */
function addProduct() {
  const name        = document.getElementById('pName').value.trim();
  const description = document.getElementById('pDesc').value.trim();
  const price       = parseFloat(document.getElementById('pPrice').value);
  const stock       = parseInt(document.getElementById('pStock').value);
  const categoryId  = document.getElementById('pCategory').value;
  const newCatName  = document.getElementById('pNewCategory').value.trim();

  if (!name || isNaN(price) || isNaN(stock)) return toast('Please fill Name, Price and Stock', 'error');
  if (!categoryId && !newCatName) return toast('Please select or enter a category', 'error');

  const doSave = (resolvedCategoryId) => {
    const body = { name, description, price, stock };
    if (resolvedCategoryId) body.category = { id: parseInt(resolvedCategoryId) };

    showSpinner('Saving product...');
    fetch(`${API}/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    })
      .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t || 'Save failed'); }); return r.json(); })
      .then(() => {
        hideSpinner();
        toast(`${productEmoji(name)} "${name}" saved! ✅`);
        ['pName','pDesc','pPrice','pStock','pNewCategory'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('pCategory').value = '';
        loadProducts();
        loadCategories();
      })
      .catch(err => { hideSpinner(); toast('Failed to save: ' + err.message, 'error'); });
  };

  if (newCatName) {
    // Create category first, then create product with its id
    showSpinner('Creating category...');
    fetch(`${API}/categories`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: newCatName })
    })
      .then(r => { if (!r.ok) throw new Error('Category creation failed'); return r.json(); })
      .then(cat => { hideSpinner(); doSave(cat.id); })
      .catch(err => { hideSpinner(); toast(err.message, 'error'); });
  } else {
    doSave(categoryId);
  }
}

/* ─── CART — all requests send JWT ───────────────────────*/
function addToCart(productId) {
  if (!currentUser) return toast('Please login first 🔐', 'error');
  const qty = parseInt(document.getElementById(`qty-${productId}`).value) || 1;
  const btn = document.querySelector(`[onclick="addToCart(${productId})"]`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  fetch(`${API}/cart/${currentUser.id}/add?productId=${productId}&quantity=${qty}`, {
    method: 'POST',
    headers: authHeaders()
  })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(() => {
      toast('Added to cart! 🛒');
      updateCartBadge();
      if (btn) { btn.disabled = false; btn.textContent = '🛒 Add'; }
    })
    .catch(err => {
      toast('Failed to add to cart: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = '🛒 Add'; }
    });
}

function loadCart() {
  if (!currentUser) {
    document.getElementById('cartContent').innerHTML = '<div class="empty-state">🔐 Please login to view your cart</div>';
    document.getElementById('cartFooter').classList.add('hidden');
    return;
  }
  showSpinner('Loading your cart...');
  fetch(`${API}/cart/${currentUser.id}`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(items => { hideSpinner(); renderCart(items); })
    .catch(() => { hideSpinner(); toast('Could not load cart', 'error'); });
}

function renderCart(items) {
  const content = document.getElementById('cartContent');
  const footer  = document.getElementById('cartFooter');
  if (!items || !items.length) {
    content.innerHTML = `<div class="empty-state">🛒 Your cart is empty<br>
      <small style="color:var(--text2);font-size:0.8rem">Add some products to get started!</small></div>`;
    footer.classList.add('hidden');
    return;
  }
  const total = items.reduce((sum, i) => sum + ((i.product?.price || 0) * (i.quantity || 1)), 0);
  content.innerHTML = items.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <div class="cart-item-left">
        <div class="cart-item-emoji">${productEmoji(item.product?.name)}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product?.name || 'Product'}</div>
          <div class="cart-item-price">₹${(item.product?.price || 0).toLocaleString('en-IN')} each</div>
          <div class="cart-item-qty">Subtotal: ₹${((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="qty-stepper">
          <button class="stepper-btn" onclick="changeCartQty(${item.product?.id}, ${item.id}, ${item.quantity}, -1)">−</button>
          <span class="stepper-qty">${item.quantity}</span>
          <button class="stepper-btn" onclick="changeCartQty(${item.product?.id}, ${item.id}, ${item.quantity}, 1)">+</button>
        </div>
        <button class="btn-danger" id="remove-btn-${item.id}" onclick="removeFromCart(${item.product?.id}, ${item.id})">Remove</button>
      </div>
    </div>
  `).join('');
  document.getElementById('cartTotal').innerHTML = `Total: <span>₹${total.toLocaleString('en-IN')}</span>`;
  footer.classList.remove('hidden');
}

/* FIX: changeCartQty — safe sequential fetch, no race condition */
function changeCartQty(productId, cartItemId, currentQty, delta) {
  if (!currentUser) return;
  const newQty = currentQty + delta;
  if (newQty <= 0) { removeFromCart(productId, cartItemId); return; }

  // Disable both stepper buttons during update
  const steppersRow = document.querySelectorAll(`#cart-item-${cartItemId} .stepper-btn`);
  steppersRow.forEach(b => b.disabled = true);

  // Remove first, then add new quantity (sequential, not parallel)
  fetch(`${API}/cart/${currentUser.id}/remove?productId=${productId}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
    .then(r => { if (!r.ok) throw new Error(); })
    .then(() => fetch(`${API}/cart/${currentUser.id}/add?productId=${productId}&quantity=${newQty}`, {
      method: 'POST',
      headers: authHeaders()
    }))
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(() => fetch(`${API}/cart/${currentUser.id}`, { headers: authHeaders() }))
    .then(r => r.json())
    .then(items => {
      renderCart(items);
      updateCartBadge(items);
    })
    .catch(() => { toast('Failed to update quantity', 'error'); loadCart(); });
}

function removeFromCart(productId, cartItemId) {
  if (!currentUser) return;
  const btn  = document.getElementById(`remove-btn-${cartItemId}`);
  const item = document.getElementById(`cart-item-${cartItemId}`);
  if (btn)  { btn.disabled = true; btn.textContent = '...'; }
  if (item) item.style.opacity = '0.4';

  fetch(`${API}/cart/${currentUser.id}/remove?productId=${productId}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
    .then(r => { if (!r.ok) throw new Error('Delete failed: ' + r.status); })
    .then(() => {
      toast('Item removed 🗑️');
      return fetch(`${API}/cart/${currentUser.id}`, { headers: authHeaders() });
    })
    .then(r => r.json())
    .then(items => {
      renderCart(items);
      updateCartBadge(items);
    })
    .catch(err => {
      console.error('Remove error:', err);
      toast('Remove failed', 'error');
      if (btn)  { btn.disabled = false; btn.textContent = 'Remove'; }
      if (item) item.style.opacity = '1';
    });
}

/* FIX: badge shows total quantity across all items, not just item count */
function updateCartBadge(items) {
  if (items) {
    const total = items.reduce((s, i) => s + (i.quantity || 1), 0);
    document.getElementById('cartBadge').textContent = total;
    return;
  }
  if (!currentUser) return;
  fetch(`${API}/cart/${currentUser.id}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(items => {
      const total = items.reduce((s, i) => s + (i.quantity || 1), 0);
      document.getElementById('cartBadge').textContent = total;
    })
    .catch(() => {});
}

/* ─── PLACE ORDER ─────────────────────────────────────── */
function placeOrder() {
  if (!currentUser) return toast('Please login first', 'error');
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.textContent = 'Placing Order...';
  showSpinner('Placing your order...');

  fetch(`${API}/orders/${currentUser.id}/place`, {
    method: 'POST',
    headers: authHeaders()
  })
    .then(r => {
      if (!r.ok) return r.text().then(t => { throw new Error(t || r.status); });
      return r.json();
    })
    .then(order => {
      hideSpinner();
      btn.disabled = false; btn.textContent = 'Place Order →';
      document.getElementById('cartContent').innerHTML =
        `<div class="empty-state">🛒 Your cart is empty<br>
          <small style="color:var(--text2);font-size:0.8rem">Add some products to get started!</small></div>`;
      document.getElementById('cartFooter').classList.add('hidden');
      document.getElementById('cartBadge').textContent = '0';
      showOrderModal(order.id, order.totalAmount || 0);
      loadProducts();
    })
    .catch(err => {
      hideSpinner();
      btn.disabled = false; btn.textContent = 'Place Order →';
      toast(`Order failed: ${err.message}`, 'error');
    });
}

/* ─── ORDERS ──────────────────────────────────────────── */
function loadOrders() {
  if (!currentUser) {
    document.getElementById('ordersContent').innerHTML = '<div class="empty-state">🔐 Please login to view your orders</div>';
    return;
  }
  showSpinner('Fetching your orders...');
  fetch(`${API}/orders/${currentUser.id}`, { headers: authHeaders() })
    .then(r => r.json())
    .then(orders => {
      hideSpinner();
      if (!orders.length) {
        document.getElementById('ordersContent').innerHTML =
          `<div class="empty-state">📦 No orders yet<br>
            <small style="color:var(--text2);font-size:0.8rem">Place your first order today!</small></div>`;
        return;
      }
      renderOrders(orders.reverse());
    })
    .catch(() => { hideSpinner(); toast('Could not load orders', 'error'); });
}

function renderOrders(orders) {
  document.getElementById('ordersContent').innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-header" onclick="toggleOrderItems(${o.id})" style="cursor:pointer">
        <div>
          <div class="order-id">Order #${o.id}</div>
          <div class="order-date">${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN',
            {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'N/A'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.8rem;flex-wrap:wrap">
          <span class="order-status">${o.status || 'PLACED'}</span>
          <div class="order-total">₹${(o.totalAmount || 0).toLocaleString('en-IN')}</div>
          <span class="order-toggle" id="toggle-${o.id}">▼ Details</span>
        </div>
      </div>
      <div class="order-items hidden" id="order-items-${o.id}">
        ${o.items && o.items.length ? o.items.map(item => `
          <div class="order-item-row">
            <span class="order-item-emoji">${productEmoji(item.productName)}</span>
            <span class="order-item-name">${item.productName}</span>
            <span class="order-item-qty">× ${item.quantity}</span>
            <span class="order-item-price">₹${(item.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
        `).join('') : '<div style="padding:1rem;color:var(--text2);font-size:0.85rem;text-align:center">No item details</div>'}
      </div>
    </div>
  `).join('');
}

function toggleOrderItems(orderId) {
  const el = document.getElementById(`order-items-${orderId}`);
  const tg = document.getElementById(`toggle-${orderId}`);
  if (el.classList.contains('hidden')) { el.classList.remove('hidden'); tg.textContent = '▲ Hide'; }
  else { el.classList.add('hidden'); tg.textContent = '▼ Details'; }
}

/* ─── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroSection').classList.remove('hidden');
  document.getElementById('authLink').onclick = () => showSection('auth');
  loadCategories();

  // FIX: if token exists in localStorage, try to restore session
  if (jwtToken) {
    // Decode JWT payload to restore user info (no library needed)
    try {
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      // Check token hasn't expired
      if (payload.exp && Date.now() / 1000 < payload.exp) {
        // Fetch current user info from a /auth/me or /users/me endpoint if available
        fetch(`${API}/users/me`, { headers: authHeaders() })
          .then(r => { if (!r.ok) throw new Error(); return r.json(); })
          .then(user => {
            currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
            onLoginSuccess();
          })
          .catch(() => {
            // If no /me endpoint or token is bad, clear it
            jwtToken = null;
            localStorage.removeItem('gk_token');
          });
      } else {
        jwtToken = null;
        localStorage.removeItem('gk_token');
      }
    } catch {
      jwtToken = null;
      localStorage.removeItem('gk_token');
    }
  }
});