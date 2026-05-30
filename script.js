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

// Use relative /api when served via nginx (port 80/443, local Docker or EC2).
// Fall back to direct backend URL when opening index.html as a file or via Live Server.
const API = (location.protocol === 'file:' || location.port === '5500' || location.port === '3000')
  ? 'http://localhost:8080/api'
  : '/api';

let currentUser  = null;   // { id, name, email, role }
let jwtToken     = localStorage.getItem('gk_token') || null;
let allProducts  = [];
let allCategories = [];
let activeCategory = 'all';  // category id (number) or 'all'
let activeSearch   = '';

// Coupon applied to the cart (cleared after a successful order or on logout).
// Shape: { code: 'WELCOME20', discountPercent: 20 } | null
let appliedCoupon = null;
let cartSubtotal  = 0;  // most recent subtotal seen in renderCart, used by applyCoupon's math
let activeCoupons = [];   // loaded for cart dropdown

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

/* ─── PRODUCT VISUAL (S3 image when present, emoji fallback) ─── */
function productImageUrl(p) {
  if (!p) return null;
  // Backend may return a derived `imageUrl`, or just the raw S3 key.
  if (p.imageUrl) return p.imageUrl;
  if (p.imageKey) {
    // Default-region public URL; safe even if a CDN domain is later added,
    // since the backend can simply start returning `imageUrl` directly.
    return `https://gotokart-product-images-035379289330-us-east-1-an.s3.us-east-1.amazonaws.com/${p.imageKey}`;
  }
  return null;
}

function productVisual(p) {
  if (p.imageUrl) {
    const safeName = (p.name || '').replace(/"/g, '&quot;');
    return `<img src="${p.imageUrl}" alt="${safeName}" style="width:80px;height:80px;border-radius:8px;object-fit:cover">`;
  }
  return `<span class="product-emoji">${productEmoji(p.name)}</span>`;
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
  // Books & stationery
  if (n.includes('book') || n.includes('novel') || n.includes('textbook') || n.includes('ncert')) return '📚';
  if (n.includes('pen') || n.includes('pencil') || n.includes('marker')) return '✏️';
  if (n.includes('notebook') || n.includes('diary') || n.includes('journal')) return '📓';
  if (n.includes('calculator')) return '🔢';
  if (n.includes('geometry') || n.includes('compass') || n.includes('ruler') || n.includes('stationery')) return '📐';
  if (n.includes('stapler') || n.includes('file') || n.includes('folder')) return '🗂️';
  if (n.includes('paper') || n.includes('printer paper')) return '📄';
  if (n.includes('glue') || n.includes('fevicol') || n.includes('adhesive')) return '🧴';
  // Sports & fitness
  if (n.includes('cricket') || n.includes('bat') || n.includes('stumps')) return '🏏';
  if (n.includes('football') || n.includes('soccer')) return '⚽';
  if (n.includes('basketball')) return '🏀';
  if (n.includes('badminton') || n.includes('racket')) return '🏸';
  if (n.includes('tennis')) return '🎾';
  if (n.includes('gym') || n.includes('dumbbell') || n.includes('weight') || n.includes('barbell')) return '🏋️';
  if (n.includes('yoga') || n.includes('mat')) return '🧘';
  if (n.includes('cycle') || n.includes('bicycle')) return '🚲';
  if (n.includes('treadmill')) return '🏃';
  if (n.includes('protein') || n.includes('whey') || n.includes('supplement')) return '💪';
  if (n.includes('skipping') || n.includes('jump rope') || n.includes('resistance band')) return '🤸';
  if (n.includes('fitbit') || n.includes('fitness tracker')) return '⌚';
  // Home & kitchen
  if (n.includes('ac ') || n.includes(' ac') || n === 'ac' || n.includes('air conditioner')) return '❄️';
  if (n.includes('fridge') || n.includes('refrigerator')) return '🧊';
  if (n.includes('washing machine') || n.includes('washer')) return '🫧';
  if (n.includes('microwave') || n.includes('oven') || n.includes('toaster')) return '🍳';
  if (n.includes('geyser') || n.includes('water heater')) return '🚿';
  if (n.includes('fan') || n.includes('cooler') || n.includes('exhaust')) return '💨';
  if (n.includes('heater')) return '🔥';
  if (n.includes('induction') || n.includes('cooktop') || n.includes('stove')) return '🍳';
  if (n.includes('air fryer') || n.includes('fryer')) return '🍟';
  if (n.includes('blender') || n.includes('mixer') || n.includes('grinder') || n.includes('juicer')) return '🥤';
  if (n.includes('pressure cooker') || n.includes('cooker')) return '🫕';
  if (n.includes('flask') || n.includes('thermos') || n.includes('bottle') || n.includes('sipper')) return '🍶';
  if (n.includes('dinner set') || n.includes('crockery') || n.includes('opalware')) return '🍽️';
  if (n.includes('chair') || n.includes('sofa') || n.includes('couch')) return '🪑';
  if (n.includes('bed') || n.includes('mattress') || n.includes('pillow') || n.includes('bed sheet')) return '🛏️';
  if (n.includes('blanket') || n.includes('quilt')) return '🛌';
  if (n.includes('lamp') || n.includes('bulb') || n.includes('led') || n.includes('light')) return '💡';
  if (n.includes('clock') || n.includes('alarm')) return '⏰';
  if (n.includes('mirror')) return '🪞';
  if (n.includes('paint') || n.includes('putty') || n.includes('wall')) return '🎨';
  // Toys & games
  if (n.includes('lego') || n.includes('brick')) return '🧱';
  if (n.includes('toy') || n.includes('doll') || n.includes('teddy')) return '🧸';
  if (n.includes('playstation') || n.includes('xbox') || n.includes('nintendo') || n.includes('blaster') || n.includes('nerf')) return '🎮';
  if (n.includes('puzzle') || n.includes('jigsaw') || n.includes('rubik')) return '🧩';
  if (n.includes('chess') || n.includes('board game') || n.includes('carrom') || n.includes('uno') || n.includes('monopoly') || n.includes('scrabble')) return '♟️';
  if (n.includes('remote control') || n.includes('rc car') || n.includes('hot wheels')) return '🚗';
  // Food & grocery
  if (n.includes('milk') || n.includes('paneer')) return '🥛';
  if (n.includes('coffee')) return '☕';
  if (n.includes('tea') || n.includes('chai')) return '🍵';
  if (n.includes('juice') || n.includes('drink')) return '🧃';
  if (n.includes('chocolate') || n.includes('candy') || n.includes('dairy milk')) return '🍫';
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('marie')) return '🍪';
  if (n.includes('chips') || n.includes('snack') || n.includes('namkeen')) return '🍟';
  if (n.includes('rice') || n.includes('wheat') || n.includes('atta') || n.includes('flour')) return '🌾';
  if (n.includes('oil') || n.includes('ghee') || n.includes('sunflower')) return '🫙';
  if (n.includes('fruit') || n.includes('apple') || n.includes('mango') || n.includes('banana')) return '🍎';
  if (n.includes('vegetable') || n.includes('veggie')) return '🥦';
  if (n.includes('bread')) return '🍞';
  if (n.includes('butter') || n.includes('cheese') || n.includes('amul')) return '🧀';
  if (n.includes('egg')) return '🥚';
  if (n.includes('honey') || n.includes('dabur')) return '🍯';
  if (n.includes('noodle') || n.includes('pasta') || n.includes('maggi')) return '🍜';
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
function showOrderModal(orderId, total, discount) {
  const savings = (discount || 0) > 0
    ? `<br><span style="color:#3fb950;font-size:0.9rem">You saved ₹${(discount).toLocaleString('en-IN')} 🎉</span>`
    : '';
  document.getElementById('modalMsg').innerHTML =
    `Your Order <strong>#${orderId}</strong> placed successfully!<br>
     Total: <strong style="color:var(--accent)">₹${(total || 0).toLocaleString('en-IN')}</strong>${savings}`;
  document.getElementById('orderModal').classList.remove('hidden');
}
function closeOrderModal() {
  document.getElementById('orderModal').classList.add('hidden');
  showSection('products');
}

/* ─── NAVIGATION ──────────────────────────────────────── */
function showSection(name) {
  ['hero', 'auth', 'products', 'cart', 'orders', 'admin'].forEach(s => {
    const el = document.getElementById(s + 'Section');
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById(name + 'Section');
  if (target) target.classList.remove('hidden');

  if (name === 'products') { loadProducts(); document.getElementById('navShop').classList.add('active'); }
  if (name === 'cart')     { loadCart();     document.getElementById('navCart').classList.add('active'); }
  if (name === 'orders')   { loadOrders();   document.getElementById('navOrders').classList.add('active'); }
  if (name === 'admin')    { enterAdminDashboard(); document.getElementById('navAdmin').classList.add('active'); }
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
  const isAdmin = (currentUser.role || '').toUpperCase() === 'ADMIN';
  document.getElementById('adminToggleBtn').classList.toggle('hidden', !isAdmin);
  document.getElementById('navAdmin').classList.toggle('hidden', !isAdmin);
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
  appliedCoupon = null;
  localStorage.removeItem('gk_token');
  document.getElementById('authLink').textContent = 'Login';
  document.getElementById('authLink').onclick = () => showSection('auth');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('cartBadge').textContent = '0';
  document.getElementById('adminToggleBtn').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('navAdmin').classList.add('hidden');
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
      ${productVisual(p)}
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
      loadCategories();
    })
    .catch(err => { hideSpinner(); toast('Failed to remove: ' + err.message, 'error'); });
}

function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  const opening = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (opening) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('pName')?.focus(), 300);
  }
}

/** Admin dashboard → shop add-product panel (not the modal). */
function openAddProductPanel() {
  showSection('products');
  const panel = document.getElementById('adminPanel');
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('pName')?.focus(), 300);
}

/* ─── ADD PRODUCT (admin only) ─── sends JWT + category ── */
async function uploadProductImage(productId, file) {
  // Three-step S3 presigned-URL flow:
  //   1) Backend signs a PUT URL  →  2) Browser PUTs bytes to S3  →  3) Backend persists the key
  const ct = file.type;

  const r1 = await fetch(
    `${API}/products/${productId}/image-upload-url?contentType=${encodeURIComponent(ct)}`,
    { method: 'POST', headers: authHeaders() }
  );
  if (!r1.ok) throw new Error(`Could not get upload URL (HTTP ${r1.status})`);
  const { url, key } = await r1.json();

  const r2 = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': ct },
    body: file
  });
  if (!r2.ok) throw new Error(`S3 upload failed (HTTP ${r2.status})`);

  const r3 = await fetch(`${API}/products/${productId}/image`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ imageKey: key })
  });
  if (!r3.ok) throw new Error(`Could not save image key (HTTP ${r3.status})`);
}

function addProduct() {
  const name        = document.getElementById('pName').value.trim();
  const description = document.getElementById('pDesc').value.trim();
  const price       = parseFloat(document.getElementById('pPrice').value);
  const stock       = parseInt(document.getElementById('pStock').value);
  const categoryId  = document.getElementById('pCategory').value;
  const newCatName  = document.getElementById('pNewCategory').value.trim();
  const imageFile   = document.getElementById('pImage')?.files?.[0] || null;

  if (!name || isNaN(price) || isNaN(stock)) return toast('Please fill Name, Price and Stock', 'error');
  if (!categoryId && !newCatName) return toast('Please select or enter a category', 'error');
  if (imageFile && imageFile.size > 1024 * 1024) return toast('Image must be 1 MB or smaller', 'error');

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
      .then(async (saved) => {
        if (imageFile && saved && saved.id) {
          showSpinner('Uploading image to S3...');
          try {
            await uploadProductImage(saved.id, imageFile);
          } catch (e) {
            hideSpinner();
            toast('Product saved, but image upload failed: ' + e.message, 'error');
            return;
          }
        }
        hideSpinner();
        toast(`${productEmoji(name)} "${name}" saved! ✅`);
        ['pName','pDesc','pPrice','pStock','pNewCategory'].forEach(id => document.getElementById(id).value = '');
        const imgInput = document.getElementById('pImage');
        if (imgInput) imgInput.value = '';
        document.getElementById('pCategory').value = '';
        loadProducts();
        loadCategories();
      })
      .catch(err => { hideSpinner(); toast('Failed to save: ' + err.message, 'error'); });
  };

  if (newCatName) {
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

/* ─── CART ────────────────────────────────────────────── */
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
  const content   = document.getElementById('cartContent');
  const footer    = document.getElementById('cartFooter');
  const couponRow = document.getElementById('couponRow');

  if (!items || !items.length) {
    content.innerHTML = `<div class="empty-state">🛒 Your cart is empty<br>
      <small style="color:var(--text2);font-size:0.8rem">Add some products to get started!</small></div>`;
    footer.classList.add('hidden');
    couponRow.classList.add('hidden');
    // An empty cart can't carry a coupon — drop it so checkout state stays clean.
    appliedCoupon = null;
    return;
  }

  cartSubtotal = items.reduce((sum, i) => sum + ((i.product?.price || 0) * (i.quantity || 1)), 0);

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

  couponRow.classList.remove('hidden');
  loadActiveCoupons();
  renderCouponState();
  renderCartSummary();
  footer.classList.remove('hidden');
}

/**
 * Builds the subtotal / discount / total breakdown shown above the
 * "Place Order" button. Called after every cart mutation and every
 * coupon apply/remove.
 */
function renderCartSummary() {
  const summary  = document.getElementById('cartSummary');
  if (!summary) return;
  const discount = appliedCoupon
    ? Math.round(cartSubtotal * (appliedCoupon.discountPercent || 0)) / 100
    : 0;
  const total    = Math.max(0, cartSubtotal - discount);

  summary.innerHTML = `
    <div class="cart-summary-line">
      <span>Subtotal</span>
      <span>₹${cartSubtotal.toLocaleString('en-IN')}</span>
    </div>
    ${appliedCoupon ? `
      <div class="cart-summary-line discount">
        <span>Discount (${appliedCoupon.code} · ${appliedCoupon.discountPercent}%)</span>
        <span>− ₹${discount.toLocaleString('en-IN')}</span>
      </div>
    ` : ''}
    <div class="cart-summary-line total">
      <span>Total</span>
      <span class="amount">₹${total.toLocaleString('en-IN')}</span>
    </div>
  `;
}

/** Swaps between the input box and the "applied ✅" box. */
function renderCouponState() {
  const wrap    = document.getElementById('couponInputWrap');
  const applied = document.getElementById('couponAppliedBox');
  if (!wrap || !applied) return;
  if (appliedCoupon) {
    wrap.classList.add('hidden');
    applied.classList.remove('hidden');
    document.getElementById('couponAppliedCode').textContent = appliedCoupon.code;
    const discount = Math.round(cartSubtotal * (appliedCoupon.discountPercent || 0)) / 100;
    document.getElementById('couponAppliedDesc').textContent =
      `${appliedCoupon.discountPercent}% off · you save ₹${discount.toLocaleString('en-IN')}`;
  } else {
    wrap.classList.remove('hidden');
    applied.classList.add('hidden');
    closeCouponPicker();
  }
}

function toggleCouponPicker(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('couponPickerMenu');
  const trigger = document.getElementById('couponPickerTrigger');
  if (!menu || !trigger) return;
  const opening = menu.classList.contains('hidden');
  if (opening) {
    loadActiveCoupons().then(() => openCouponPicker());
  } else {
    closeCouponPicker();
  }
}

function closeCouponPicker() {
  const menu = document.getElementById('couponPickerMenu');
  const trigger = document.getElementById('couponPickerTrigger');
  const row = document.getElementById('couponRow');
  if (menu) menu.classList.add('hidden');
  if (trigger) trigger.classList.remove('open');
  if (row) row.classList.remove('open');
}

function openCouponPicker() {
  const menu = document.getElementById('couponPickerMenu');
  const trigger = document.getElementById('couponPickerTrigger');
  const row = document.getElementById('couponRow');
  if (menu) menu.classList.remove('hidden');
  if (trigger) trigger.classList.add('open');
  if (row) row.classList.add('open');
}

function loadActiveCoupons() {
  return fetch(`${API}/coupons/active`)
    .then(r => (r.ok ? r.json() : []))
    .then(list => {
      activeCoupons = list || [];
      renderCouponDropdown();
    })
    .catch(() => { activeCoupons = []; renderCouponDropdown(); });
}

function renderCouponDropdown() {
  const menu = document.getElementById('couponPickerMenu');
  if (!menu) return;
  if (!activeCoupons.length) {
    menu.innerHTML = '<div class="coupon-picker-empty">No coupons available</div>';
    return;
  }
  menu.innerHTML = activeCoupons.map(c => {
    const safeCode = String(c.code || '').replace(/"/g, '&quot;');
    return `
    <button type="button" class="coupon-picker-item" data-code="${safeCode}">
      <span class="coupon-picker-code">${adminEscape(c.code)}</span>
      <span class="coupon-picker-off">${c.discountPercent}% off</span>
    </button>`;
  }).join('');
}

async function parseApiError(response, fallback) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const json = JSON.parse(text);
    return json.message || json.error || text;
  } catch {
    return text;
  }
}

function applyCoupon(code) {
  code = (code || '').trim().toUpperCase();
  if (!code) return toast('Please select a coupon', 'error');
  if (!currentUser) return toast('Please login first', 'error');

  closeCouponPicker();
  showSpinner('Applying coupon...');

  fetch(`${API}/coupons/validate?code=${encodeURIComponent(code)}`, {
    headers: authHeaders()
  })
    .then(async r => {
      if (!r.ok) throw new Error(await parseApiError(r, 'Coupon not valid'));
      return r.json();
    })
    .then(coupon => {
      hideSpinner();
      appliedCoupon = { code: coupon.code, discountPercent: coupon.discountPercent };
      toast(`🎟️ ${coupon.code} applied — ${coupon.discountPercent}% off`);
      renderCouponState();
      renderCartSummary();
    })
    .catch(err => {
      hideSpinner();
      toast(err.message || 'Coupon could not be applied', 'error');
      loadActiveCoupons();
    });
}

function removeCoupon() {
  appliedCoupon = null;
  renderCouponState();
  renderCartSummary();
  toast('Coupon removed');
}

function changeCartQty(productId, cartItemId, currentQty, delta) {
  if (!currentUser) return;
  const newQty = currentQty + delta;
  if (newQty <= 0) { removeFromCart(productId, cartItemId); return; }

  const steppersRow = document.querySelectorAll(`#cart-item-${cartItemId} .stepper-btn`);
  steppersRow.forEach(b => b.disabled = true);

  fetch(`${API}/cart/${currentUser.id}/remove?productId=${productId}`, {
    method: 'DELETE', headers: authHeaders()
  })
    .then(r => { if (!r.ok) throw new Error(); })
    .then(() => fetch(`${API}/cart/${currentUser.id}/add?productId=${productId}&quantity=${newQty}`, {
      method: 'POST', headers: authHeaders()
    }))
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(() => fetch(`${API}/cart/${currentUser.id}`, { headers: authHeaders() }))
    .then(r => r.json())
    .then(items => { renderCart(items); updateCartBadge(items); })
    .catch(() => { toast('Failed to update quantity', 'error'); loadCart(); });
}

function removeFromCart(productId, cartItemId) {
  if (!currentUser) return;
  const btn  = document.getElementById(`remove-btn-${cartItemId}`);
  const item = document.getElementById(`cart-item-${cartItemId}`);
  if (btn)  { btn.disabled = true; btn.textContent = '...'; }
  if (item) item.style.opacity = '0.4';

  fetch(`${API}/cart/${currentUser.id}/remove?productId=${productId}`, {
    method: 'DELETE', headers: authHeaders()
  })
    .then(r => { if (!r.ok) throw new Error('Delete failed: ' + r.status); })
    .then(() => {
      toast('Item removed 🗑️');
      return fetch(`${API}/cart/${currentUser.id}`, { headers: authHeaders() });
    })
    .then(r => r.json())
    .then(items => { renderCart(items); updateCartBadge(items); })
    .catch(err => {
      console.error('Remove error:', err);
      toast('Remove failed', 'error');
      if (btn)  { btn.disabled = false; btn.textContent = 'Remove'; }
      if (item) item.style.opacity = '1';
    });
}

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

  // Pass the coupon code along so the backend can re-validate and bump
  // usedCount inside the same DB transaction as the order insert.
  const body = appliedCoupon ? { couponCode: appliedCoupon.code } : {};

  fetch(`${API}/orders/${currentUser.id}/place`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
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
      document.getElementById('couponRow').classList.add('hidden');
      document.getElementById('cartBadge').textContent = '0';
      // Successful order — drop the coupon so a fresh cart starts clean.
      appliedCoupon = null;
      showOrderModal(order.id, order.totalAmount || 0, order.discountAmount || 0);
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
  document.getElementById('ordersContent').innerHTML = orders.map(o => {
    const hasDiscount = (o.discountAmount || 0) > 0 && o.couponCode;
    return `
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
        ${hasDiscount ? `
          <div class="order-item-row" style="border-bottom:none;color:var(--text2);font-size:0.85rem;margin-top:0.5rem">
            <span style="flex:1">Subtotal</span>
            <span>₹${(o.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="order-item-row" style="border-bottom:none;color:#3fb950;font-size:0.85rem">
            <span style="flex:1">🎟️ ${o.couponCode}</span>
            <span>− ₹${(o.discountAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
      </div>
    </div>
    `;
  }).join('');
}

function toggleOrderItems(orderId) {
  const el = document.getElementById(`order-items-${orderId}`);
  const tg = document.getElementById(`toggle-${orderId}`);
  if (el.classList.contains('hidden')) { el.classList.remove('hidden'); tg.textContent = '▲ Hide'; }
  else { el.classList.add('hidden'); tg.textContent = '▼ Details'; }
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD MODULE
   All admin features (Overview / Products / Orders / Users /
   Categories / Coupons / Reviews / Revenue). Self-contained — the
   storefront keeps working with this file present even if no admin
   ever logs in.
   ═══════════════════════════════════════════════════════════════ */

const ADMIN_STATE = {
  currentTab: 'overview',
  cache: {
    stats: null,
    products: [],
    orders: [],
    users: [],
    categories: [],
    coupons: [],
    reviews: []
  },
  charts: { revenue: null, orders: null },
  editContext: null  // { kind: 'product'|'coupon'|'category', id: number|null, payload: any }
};

function enterAdminDashboard() {
  if (!currentUser || (currentUser.role || '').toUpperCase() !== 'ADMIN') {
    toast('Admin access only', 'error');
    showSection('hero');
    return;
  }
  switchAdminTab(ADMIN_STATE.currentTab || 'overview');
}

function switchAdminTab(tab) {
  ADMIN_STATE.currentTab = tab;
  document.querySelectorAll('.admin-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.adminTab === tab);
  });
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.add('hidden'));
  const panel = document.getElementById('adminPanel-' + tab);
  if (panel) panel.classList.remove('hidden');
  refreshAdminTab();
}

function refreshAdminTab() {
  switch (ADMIN_STATE.currentTab) {
    case 'overview':   return loadAdminOverview();
    case 'products':   return loadAdminProducts();
    case 'orders':     return loadAdminOrders();
    case 'users':      return loadAdminUsers();
    case 'categories': return loadAdminCategories();
    case 'coupons':    return loadAdminCoupons();
    case 'reviews':    return loadAdminReviews();
    case 'revenue':    return renderRevenueChart();
  }
}

/* ─── Tiny helpers ─────────────────────────────────────── */
const adminEscape = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const adminFmtINR = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const adminFmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return String(d); }
};
const adminStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  return `<span class="status-badge ${s}">${adminEscape(status || 'UNKNOWN')}</span>`;
};

/* ─── Overview ─────────────────────────────────────────── */
function loadAdminOverview() {
  document.getElementById('kpiGrid').innerHTML = '<div class="kpi-card kpi-loading">Loading…</div>';
  fetch(`${API}/admin/stats`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(stats => {
      ADMIN_STATE.cache.stats = stats;
      renderKpis(stats);
      renderLowStock(stats.lowStockProducts || []);
      renderRecentOrders(stats.recentOrders || []);
    })
    .catch(err => {
      document.getElementById('kpiGrid').innerHTML =
        `<div class="kpi-card kpi-loading">Failed to load: ${adminEscape(err.message)}</div>`;
    });
}

function renderKpis(s) {
  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Revenue</div>
      <div class="kpi-value accent">${adminFmtINR(s.totalRevenue)}</div>
      <div class="kpi-sub">Last 30 days: <strong>${adminFmtINR(s.revenueLast30Days)}</strong></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Orders</div>
      <div class="kpi-value">${(s.totalOrders || 0).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">Last 30 days: <strong>${(s.ordersLast30Days || 0).toLocaleString('en-IN')}</strong></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Products</div>
      <div class="kpi-value">${(s.totalProducts || 0).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">Low stock: <strong>${(s.lowStockCount || 0).toLocaleString('en-IN')}</strong></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Users</div>
      <div class="kpi-value">${(s.totalUsers || 0).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">Categories: <strong>${(s.totalCategories || 0).toLocaleString('en-IN')}</strong></div>
    </div>
  `;
}

function renderLowStock(items) {
  const el = document.getElementById('lowStockList');
  if (!items.length) {
    el.innerHTML = '<div class="admin-list-empty">🎉 Nothing low on stock right now.</div>';
    return;
  }
  el.innerHTML = items.map(p => `
    <div class="admin-list-row">
      <div class="admin-list-row-name">${adminEscape(p.name)}</div>
      <span class="status-badge low-stock">${p.stock} left</span>
    </div>
  `).join('');
}

function renderRecentOrders(orders) {
  const el = document.getElementById('recentOrdersList');
  if (!orders.length) {
    el.innerHTML = '<div class="admin-list-empty">No orders yet.</div>';
    return;
  }
  el.innerHTML = orders.map(o => `
    <div class="admin-list-row">
      <div class="admin-list-row-name">#${o.id} · ${adminEscape(o.user?.email || 'guest')}</div>
      <span class="admin-list-row-meta">${adminFmtINR(o.totalAmount)} · ${adminStatusBadge(o.status)}</span>
    </div>
  `).join('');
}

/* ─── Products tab ─────────────────────────────────────── */
function loadAdminProducts() {
  return Promise.all([
    fetch(`${API}/products`, { headers: authHeaders() }).then(r => r.json()),
    fetch(`${API}/categories`, { headers: authHeaders() }).then(r => r.json())
  ])
  .then(([products, cats]) => {
    ADMIN_STATE.cache.products   = products || [];
    ADMIN_STATE.cache.categories = cats || [];
    renderAdminProducts();
  })
  .catch(err => toast('Failed to load products: ' + err.message, 'error'));
}

function renderAdminProducts() {
  const q     = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
  const stock = document.getElementById('adminProductStock')?.value || 'all';
  let list = [...ADMIN_STATE.cache.products];
  if (q)               list = list.filter(p => (p.name || '').toLowerCase().includes(q));
  if (stock === 'instock') list = list.filter(p => (p.stock || 0) > 5);
  if (stock === 'low')     list = list.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5);
  if (stock === 'out')     list = list.filter(p => (p.stock || 0) <= 0);

  const tbody = document.querySelector('#adminProductsTable tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No products match.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${adminEscape(p.name)}</td>
      <td>${adminEscape(p.category?.name || '—')}</td>
      <td class="num">${adminFmtINR(p.price)}</td>
      <td class="num">
        ${p.stock}
        ${p.stock <= 0 ? ' <span class="status-badge cancelled">OUT</span>'
          : p.stock <= 5 ? ' <span class="status-badge low-stock">LOW</span>' : ''}
      </td>
      <td>
        <div class="cell-actions">
          <button class="btn-mini" onclick="openProductEditModal(${p.id})">Edit</button>
          <button class="btn-mini danger" onclick="confirmDeleteProduct(${p.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openProductCreateModal() {
  ADMIN_STATE.editContext = { kind: 'product', id: null, payload: {} };
  document.getElementById('adminEditTitle').textContent = 'Add Product';
  document.getElementById('adminEditBody').innerHTML = productFormHtml({});
  openModal('adminEditModal');
}

function openProductEditModal(id) {
  const p = ADMIN_STATE.cache.products.find(x => x.id === id);
  if (!p) return toast('Product not found', 'error');
  ADMIN_STATE.editContext = { kind: 'product', id, payload: p };
  document.getElementById('adminEditTitle').textContent = `Edit Product #${id}`;
  document.getElementById('adminEditBody').innerHTML = productFormHtml(p);
  openModal('adminEditModal');
}

function productFormHtml(p) {
  const cats = ADMIN_STATE.cache.categories
    .map(c => `<option value="${c.id}" ${p.category && p.category.id === c.id ? 'selected' : ''}>${adminEscape(c.name)}</option>`)
    .join('');
  return `
    <div class="admin-form">
      <div class="form-group"><label>Name</label>
        <input class="input" id="edit_pName" value="${adminEscape(p.name || '')}"></div>
      <div class="form-group"><label>Category</label>
        <select class="input" id="edit_pCategory"><option value="">— None —</option>${cats}</select></div>
      <div class="form-group" style="grid-column:1/-1"><label>Description</label>
        <input class="input" id="edit_pDesc" value="${adminEscape(p.description || '')}"></div>
      <div class="form-group"><label>Price (₹)</label>
        <input type="number" step="0.01" class="input" id="edit_pPrice" value="${p.price ?? ''}"></div>
      <div class="form-group"><label>Stock</label>
        <input type="number" class="input" id="edit_pStock" value="${p.stock ?? ''}"></div>
    </div>
  `;
}

function confirmDeleteProduct(id) {
  const p = ADMIN_STATE.cache.products.find(x => x.id === id);
  openAdminConfirmModal(
    'Delete product?',
    `“${adminEscape(p?.name || ('#' + id))}” will be removed permanently.`,
    () => {
      fetch(`${API}/products/${id}`, { method: 'DELETE', headers: authHeaders() })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })
        .then(() => { toast('Product deleted ✅'); closeAdminConfirmModal(); loadAdminProducts(); })
        .catch(err => toast('Delete failed: ' + err.message, 'error'));
    }
  );
}

/* ─── Orders tab ───────────────────────────────────────── */
function loadAdminOrders() {
  fetch(`${API}/orders`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(orders => { ADMIN_STATE.cache.orders = orders || []; renderAdminOrders(); })
    .catch(err => toast('Failed to load orders: ' + err.message, 'error'));
}

function renderAdminOrders() {
  const q      = (document.getElementById('adminOrderSearch')?.value || '').toLowerCase();
  const status = document.getElementById('adminOrderStatus')?.value || 'all';
  let list = [...ADMIN_STATE.cache.orders];
  if (status !== 'all') list = list.filter(o => (o.status || '').toUpperCase() === status);
  if (q) list = list.filter(o =>
    String(o.id).includes(q) ||
    (o.user?.email || '').toLowerCase().includes(q) ||
    (o.user?.name  || '').toLowerCase().includes(q)
  );

  const tbody = document.querySelector('#adminOrdersTable tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No orders match.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${adminEscape(o.user?.email || o.user?.name || 'guest')}</td>
      <td>${adminFmtDate(o.createdAt)}</td>
      <td class="num">${(o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)}</td>
      <td class="num">${adminFmtINR(o.totalAmount)}</td>
      <td>
        <select class="cell-select" onchange="updateOrderStatus(${o.id}, this.value)">
          ${['PLACED','SHIPPED','DELIVERED','CANCELLED'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="cell-actions">
          <button class="btn-mini" onclick="showOrderDetailsModal(${o.id})">Details</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateOrderStatus(id, status) {
  fetch(`${API}/orders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t || 'Update failed'); }); return r.json(); })
    .then(updated => {
      const idx = ADMIN_STATE.cache.orders.findIndex(o => o.id === id);
      if (idx >= 0) ADMIN_STATE.cache.orders[idx] = updated;
      toast(`Order #${id} → ${status}`);
    })
    .catch(err => { toast('Status update failed: ' + err.message, 'error'); loadAdminOrders(); });
}

function showOrderDetailsModal(id) {
  const o = ADMIN_STATE.cache.orders.find(x => x.id === id);
  if (!o) return toast('Order not found', 'error');
  ADMIN_STATE.editContext = { kind: 'orderDetails', id: null, payload: null };  // read-only
  document.getElementById('adminEditTitle').textContent = `Order #${id} · ${adminEscape(o.status || '')}`;
  const hasDiscount = (o.discountAmount || 0) > 0 && o.couponCode;
  document.getElementById('adminEditBody').innerHTML = `
    <p style="margin-bottom:0.5rem;color:var(--text2);font-size:0.85rem">
      ${adminFmtDate(o.createdAt)} · <strong>${adminEscape(o.user?.email || '—')}</strong>
    </p>
    <div class="order-detail-list">
      ${(o.items || []).map(it => `
        <div class="row">
          <span>${adminEscape(it.productName)} <span style="color:var(--text2)">× ${it.quantity}</span></span>
          <span><strong>${adminFmtINR(it.subtotal)}</strong></span>
        </div>
      `).join('')}
      ${hasDiscount ? `
        <div class="row" style="color:var(--text2)">
          <span>Subtotal</span><span>${adminFmtINR(o.subtotal)}</span>
        </div>
        <div class="row" style="color:#3fb950">
          <span>🎟️ ${adminEscape(o.couponCode)}</span><span>− ${adminFmtINR(o.discountAmount)}</span>
        </div>
      ` : ''}
      <div class="row" style="margin-top:0.5rem;border-top:1px solid var(--border);padding-top:0.7rem">
        <strong>Total</strong><strong style="color:var(--accent)">${adminFmtINR(o.totalAmount)}</strong>
      </div>
    </div>
  `;
  document.getElementById('adminEditSave').classList.add('hidden');
  openModal('adminEditModal');
}

/* ─── Users tab ────────────────────────────────────────── */
function loadAdminUsers() {
  fetch(`${API}/users`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(users => { ADMIN_STATE.cache.users = users || []; renderAdminUsers(); })
    .catch(err => toast('Failed to load users: ' + err.message, 'error'));
}

function renderAdminUsers() {
  const q    = (document.getElementById('adminUserSearch')?.value || '').toLowerCase();
  const role = document.getElementById('adminUserRole')?.value || 'all';
  let list = [...ADMIN_STATE.cache.users];
  if (role !== 'all') list = list.filter(u => (u.role || '').toUpperCase() === role);
  if (q) list = list.filter(u =>
    (u.name  || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );

  const tbody = document.querySelector('#adminUsersTable tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No users match.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(u => {
    const isMe = currentUser && currentUser.id === u.id;
    const active = u.active !== false; // undefined/null treated as active
    return `
      <tr>
        <td>${u.id}</td>
        <td>${adminEscape(u.name || '—')}${isMe ? ' <span class="status-badge admin-role">YOU</span>' : ''}</td>
        <td>${adminEscape(u.email)}</td>
        <td>
          <select class="cell-select" ${isMe ? 'disabled' : ''} onchange="updateUserRole(${u.id}, this.value)">
            <option value="USER"  ${u.role === 'USER'  ? 'selected' : ''}>USER</option>
            <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          </select>
        </td>
        <td>${active ? '<span class="status-badge active">ACTIVE</span>' : '<span class="status-badge inactive">INACTIVE</span>'}</td>
        <td>
          <div class="cell-actions">
            <button class="btn-mini ${active ? 'danger' : 'primary'}" ${isMe ? 'disabled' : ''}
                    onclick="toggleUserActive(${u.id}, ${!active})">
              ${active ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateUserRole(id, role) {
  fetch(`${API}/admin/users/${id}/role`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ role })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(u => {
      const idx = ADMIN_STATE.cache.users.findIndex(x => x.id === id);
      if (idx >= 0) ADMIN_STATE.cache.users[idx] = u;
      toast(`Role updated → ${role}`);
    })
    .catch(err => { toast('Role update failed: ' + err.message, 'error'); loadAdminUsers(); });
}

function toggleUserActive(id, active) {
  fetch(`${API}/admin/users/${id}/active`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ active })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(u => {
      const idx = ADMIN_STATE.cache.users.findIndex(x => x.id === id);
      if (idx >= 0) ADMIN_STATE.cache.users[idx] = u;
      toast(active ? 'User reactivated' : 'User deactivated');
      renderAdminUsers();
    })
    .catch(err => { toast('Update failed: ' + err.message, 'error'); loadAdminUsers(); });
}

/* ─── Categories tab ───────────────────────────────────── */
function loadAdminCategories() {
  return Promise.all([
    fetch(`${API}/categories`, { headers: authHeaders() }).then(r => r.json()),
    fetch(`${API}/products`,   { headers: authHeaders() }).then(r => r.json())
  ])
  .then(([cats, products]) => {
    ADMIN_STATE.cache.categories = cats || [];
    ADMIN_STATE.cache.products   = products || [];
    renderAdminCategories();
  })
  .catch(err => toast('Failed to load categories: ' + err.message, 'error'));
}

function renderAdminCategories() {
  const counts = ADMIN_STATE.cache.products.reduce((acc, p) => {
    const id = p.category?.id;
    if (id != null) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const tbody = document.querySelector('#adminCategoriesTable tbody');
  if (!ADMIN_STATE.cache.categories.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No categories yet.</td></tr>';
    return;
  }
  tbody.innerHTML = ADMIN_STATE.cache.categories.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${adminEscape(c.name)}</td>
      <td class="num">${counts[c.id] || 0}</td>
      <td>
        <div class="cell-actions">
          <button class="btn-mini" onclick="openCategoryEditModal(${c.id})">Edit</button>
          <button class="btn-mini danger" onclick="confirmDeleteCategory(${c.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function adminCreateCategory() {
  const name = document.getElementById('adminNewCategory').value.trim();
  if (!name) return toast('Enter a category name', 'error');
  fetch(`${API}/categories`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ name })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(() => {
      document.getElementById('adminNewCategory').value = '';
      toast(`Category “${name}” added ✅`);
      loadAdminCategories();
      loadCategories(); // keep storefront chips in sync
    })
    .catch(err => toast('Create failed: ' + err.message, 'error'));
}

function openCategoryEditModal(id) {
  const c = ADMIN_STATE.cache.categories.find(x => x.id === id);
  if (!c) return;
  ADMIN_STATE.editContext = { kind: 'category', id, payload: c };
  document.getElementById('adminEditTitle').textContent = `Edit Category #${id}`;
  document.getElementById('adminEditBody').innerHTML = `
    <div class="form-group"><label>Name</label>
      <input class="input" id="edit_cName" value="${adminEscape(c.name)}"></div>
  `;
  openModal('adminEditModal');
}

function confirmDeleteCategory(id) {
  const c = ADMIN_STATE.cache.categories.find(x => x.id === id);
  openAdminConfirmModal(
    'Delete category?',
    `“${adminEscape(c?.name || '#' + id)}” will be removed. Products in this category will become uncategorised.`,
    () => {
      fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: authHeaders() })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })
        .then(() => { toast('Category deleted'); closeAdminConfirmModal(); loadAdminCategories(); loadCategories(); })
        .catch(err => toast('Delete failed: ' + err.message, 'error'));
    }
  );
}

/* ─── Coupons tab ──────────────────────────────────────── */
function loadAdminCoupons() {
  fetch(`${API}/coupons`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(coupons => { ADMIN_STATE.cache.coupons = coupons || []; renderAdminCoupons(); })
    .catch(err => toast('Failed to load coupons: ' + err.message, 'error'));
}

function renderAdminCoupons() {
  const tbody = document.querySelector('#adminCouponsTable tbody');
  if (!ADMIN_STATE.cache.coupons.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No coupons yet. Click “New Coupon”.</td></tr>';
    return;
  }
  tbody.innerHTML = ADMIN_STATE.cache.coupons.map(c => `
    <tr>
      <td><strong>${adminEscape(c.code)}</strong></td>
      <td class="num">${c.discountPercent || 0}%</td>
      <td class="num">${c.usedCount || 0} / ${c.usageLimit ?? '∞'}</td>
      <td>${c.validUntil ? adminFmtDate(c.validUntil) : '—'}</td>
      <td>${c.active ? '<span class="status-badge active">ACTIVE</span>' : '<span class="status-badge inactive">INACTIVE</span>'}</td>
      <td>
        <div class="cell-actions">
          <button class="btn-mini" onclick="openCouponEditModal(${c.id})">Edit</button>
          <button class="btn-mini danger" onclick="confirmDeleteCoupon(${c.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCouponCreateModal() {
  ADMIN_STATE.editContext = { kind: 'coupon', id: null, payload: {} };
  document.getElementById('adminEditTitle').textContent = 'New Coupon';
  document.getElementById('adminEditBody').innerHTML = couponFormHtml({});
  openModal('adminEditModal');
}

function openCouponEditModal(id) {
  const c = ADMIN_STATE.cache.coupons.find(x => x.id === id);
  if (!c) return;
  ADMIN_STATE.editContext = { kind: 'coupon', id, payload: c };
  document.getElementById('adminEditTitle').textContent = `Edit Coupon #${id}`;
  document.getElementById('adminEditBody').innerHTML = couponFormHtml(c);
  openModal('adminEditModal');
}

function couponFormHtml(c) {
  const dt = c.validUntil ? new Date(c.validUntil).toISOString().slice(0, 16) : '';
  const isNew = !c.id;
  return `
    <div class="admin-form">
      <div class="form-group"><label>Code</label>
        <input class="input" id="edit_cpCode" value="${adminEscape(c.code || '')}" ${isNew ? '' : 'disabled'} placeholder="WELCOME20"></div>
      <div class="form-group"><label>Discount %</label>
        <input type="number" min="1" max="100" class="input" id="edit_cpPercent" value="${c.discountPercent ?? ''}"></div>
      <div class="form-group"><label>Valid Until</label>
        <input type="datetime-local" class="input" id="edit_cpValidUntil" value="${dt}"></div>
      <div class="form-group"><label>Usage Limit</label>
        <input type="number" min="1" class="input" id="edit_cpUsageLimit" value="${c.usageLimit ?? ''}" placeholder="leave blank for unlimited"></div>
      <div class="form-group" style="grid-column:1/-1">
        <label style="display:flex;align-items:center;gap:0.4rem;text-transform:none;letter-spacing:normal">
          <input type="checkbox" id="edit_cpActive" ${c.active !== false ? 'checked' : ''}>
          <span>Active</span>
        </label>
      </div>
    </div>
  `;
}

function confirmDeleteCoupon(id) {
  const c = ADMIN_STATE.cache.coupons.find(x => x.id === id);
  openAdminConfirmModal(
    'Delete coupon?',
    `“${adminEscape(c?.code || '#' + id)}” will be removed.`,
    () => {
      fetch(`${API}/coupons/${id}`, { method: 'DELETE', headers: authHeaders() })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })
        .then(() => { toast('Coupon deleted'); closeAdminConfirmModal(); loadAdminCoupons(); })
        .catch(err => toast('Delete failed: ' + err.message, 'error'));
    }
  );
}

/* ─── Reviews tab ──────────────────────────────────────── */
function loadAdminReviews() {
  fetch(`${API}/reviews`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(reviews => { ADMIN_STATE.cache.reviews = reviews || []; renderAdminReviews(); })
    .catch(err => toast('Failed to load reviews: ' + err.message, 'error'));
}

function renderAdminReviews() {
  const status = document.getElementById('adminReviewStatus')?.value || 'all';
  let list = [...ADMIN_STATE.cache.reviews];
  if (status !== 'all') list = list.filter(r => (r.status || '').toUpperCase() === status);

  const tbody = document.querySelector('#adminReviewsTable tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No reviews to moderate.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(r => {
    const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
    return `
      <tr>
        <td>${adminEscape(r.product?.name || '—')}</td>
        <td>${adminEscape(r.user?.email || r.user?.name || 'guest')}</td>
        <td class="num"><span class="star-rating">${stars}</span></td>
        <td style="max-width:340px;word-wrap:break-word">${adminEscape(r.comment || '—')}</td>
        <td>${adminStatusBadge(r.status)}</td>
        <td>
          <div class="cell-actions">
            ${r.status !== 'APPROVED' ? `<button class="btn-mini primary" onclick="moderateReview(${r.id}, 'APPROVED')">Approve</button>` : ''}
            ${r.status !== 'REJECTED' ? `<button class="btn-mini danger" onclick="moderateReview(${r.id}, 'REJECTED')">Reject</button>` : ''}
            <button class="btn-mini" onclick="confirmDeleteReview(${r.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function moderateReview(id, status) {
  fetch(`${API}/reviews/${id}/status`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(updated => {
      const idx = ADMIN_STATE.cache.reviews.findIndex(x => x.id === id);
      if (idx >= 0) ADMIN_STATE.cache.reviews[idx] = updated;
      toast(`Review ${status.toLowerCase()}`);
      renderAdminReviews();
    })
    .catch(err => toast('Moderation failed: ' + err.message, 'error'));
}

function confirmDeleteReview(id) {
  openAdminConfirmModal('Delete review?', 'This action cannot be undone.', () => {
    fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })
      .then(() => { toast('Review deleted'); closeAdminConfirmModal(); loadAdminReviews(); })
      .catch(err => toast('Delete failed: ' + err.message, 'error'));
  });
}

/* ─── Revenue charts tab ───────────────────────────────── */
function renderRevenueChart() {
  const period = document.getElementById('adminRevenuePeriod')?.value || 'daily';
  fetch(`${API}/admin/revenue?period=${encodeURIComponent(period)}`, { headers: authHeaders() })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(buckets => drawCharts(buckets || []))
    .catch(err => toast('Failed to load revenue: ' + err.message, 'error'));
}

function drawCharts(buckets) {
  if (typeof Chart === 'undefined') {
    return toast('Chart.js failed to load (check your network).', 'error');
  }
  const labels   = buckets.map(b => b.period);
  const revenue  = buckets.map(b => b.revenue);
  const orderCt  = buckets.map(b => b.orders);

  // Chart.js requires you to destroy the previous instance before re-using a canvas.
  if (ADMIN_STATE.charts.revenue) ADMIN_STATE.charts.revenue.destroy();
  if (ADMIN_STATE.charts.orders)  ADMIN_STATE.charts.orders.destroy();

  const baseOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9a9890' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#9a9890' }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
    }
  };

  ADMIN_STATE.charts.revenue = new Chart(document.getElementById('revenueChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: revenue,
        backgroundColor: 'rgba(245,166,35,0.5)',
        borderColor: 'rgba(245,166,35,1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: baseOpts
  });

  ADMIN_STATE.charts.orders = new Chart(document.getElementById('ordersChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Orders',
        data: orderCt,
        borderColor: 'rgba(232,71,42,1)',
        backgroundColor: 'rgba(232,71,42,0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 3
      }]
    },
    options: baseOpts
  });
}

/* ─── Modal helpers ────────────────────────────────────── */
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.add('hidden');   document.body.style.overflow = ''; }

function closeAdminEditModal() {
  closeModal('adminEditModal');
  document.getElementById('adminEditSave').classList.remove('hidden');
  ADMIN_STATE.editContext = null;
}

function openAdminConfirmModal(title, msg, onOk) {
  document.getElementById('adminConfirmTitle').textContent = title;
  document.getElementById('adminConfirmMsg').textContent = msg;
  const btn = document.getElementById('adminConfirmOk');
  btn.onclick = () => onOk();
  openModal('adminConfirmModal');
}
function closeAdminConfirmModal() { closeModal('adminConfirmModal'); }

/* ─── Edit-modal Save dispatcher ───────────────────────── */
function adminEditSave() {
  const ctx = ADMIN_STATE.editContext;
  if (!ctx) return closeAdminEditModal();

  if (ctx.kind === 'product')  return saveProductFromModal(ctx);
  if (ctx.kind === 'category') return saveCategoryFromModal(ctx);
  if (ctx.kind === 'coupon')   return saveCouponFromModal(ctx);
}

function saveProductFromModal(ctx) {
  const name        = document.getElementById('edit_pName').value.trim();
  const description = document.getElementById('edit_pDesc').value.trim();
  const price       = parseFloat(document.getElementById('edit_pPrice').value);
  const stock       = parseInt(document.getElementById('edit_pStock').value, 10);
  const catId       = document.getElementById('edit_pCategory').value;

  if (!name || isNaN(price) || isNaN(stock)) return toast('Name, price and stock are required', 'error');

  const body = { name, description, price, stock };
  if (catId) body.category = { id: parseInt(catId, 10) };

  const url    = ctx.id ? `${API}/products/${ctx.id}` : `${API}/products`;
  const method = ctx.id ? 'PUT' : 'POST';

  fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(() => { toast(ctx.id ? 'Product updated ✅' : 'Product created ✅'); closeAdminEditModal(); loadAdminProducts(); })
    .catch(err => toast('Save failed: ' + err.message, 'error'));
}

function saveCategoryFromModal(ctx) {
  const name = document.getElementById('edit_cName').value.trim();
  if (!name) return toast('Name required', 'error');
  fetch(`${API}/categories/${ctx.id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ name })
  })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(() => { toast('Category updated'); closeAdminEditModal(); loadAdminCategories(); loadCategories(); })
    .catch(err => toast('Save failed: ' + err.message, 'error'));
}

function saveCouponFromModal(ctx) {
  const isNew     = !ctx.id;
  const codeInput = document.getElementById('edit_cpCode').value.trim().toUpperCase();
  const percent   = parseInt(document.getElementById('edit_cpPercent').value, 10);
  const validUntilRaw = document.getElementById('edit_cpValidUntil').value;
  const usageLimit    = document.getElementById('edit_cpUsageLimit').value;
  const active        = document.getElementById('edit_cpActive').checked;

  if (isNew && !codeInput) return toast('Code required', 'error');
  if (isNaN(percent) || percent < 1 || percent > 100) return toast('Discount must be 1–100', 'error');

  const body = {
    discountPercent: percent,
    validUntil: validUntilRaw ? new Date(validUntilRaw).toISOString() : null,
    usageLimit: usageLimit === '' ? null : parseInt(usageLimit, 10),
    active
  };
  if (isNew) body.code = codeInput;

  const url    = isNew ? `${API}/coupons` : `${API}/coupons/${ctx.id}`;
  const method = isNew ? 'POST' : 'PUT';

  fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t); }); return r.json(); })
    .then(() => { toast(isNew ? 'Coupon created ✅' : 'Coupon updated ✅'); closeAdminEditModal(); loadAdminCoupons(); })
    .catch(err => toast('Save failed: ' + err.message, 'error'));
}

/* ─── CSV export (client-side only — no backend trip) ──── */
function exportCsv(kind) {
  const rows = csvRowsFor(kind);
  if (!rows || rows.length < 2) return toast('Nothing to export', 'error');

  const csv = rows.map(r => r.map(cell => {
    const v = cell == null ? '' : String(cell);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(',')).join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gotokart-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length - 1} ${kind} rows ✅`);
}

function csvRowsFor(kind) {
  switch (kind) {
    case 'products': {
      const rows = [['id', 'name', 'description', 'price', 'stock', 'category']];
      ADMIN_STATE.cache.products.forEach(p => rows.push([
        p.id, p.name, p.description, p.price, p.stock, p.category?.name || ''
      ]));
      return rows;
    }
    case 'orders': {
      const rows = [['id', 'createdAt', 'email', 'status', 'totalAmount', 'items']];
      ADMIN_STATE.cache.orders.forEach(o => rows.push([
        o.id,
        o.createdAt || '',
        o.user?.email || '',
        o.status || '',
        o.totalAmount || 0,
        (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
      ]));
      return rows;
    }
    case 'users': {
      const rows = [['id', 'name', 'email', 'role', 'active']];
      ADMIN_STATE.cache.users.forEach(u => rows.push([u.id, u.name, u.email, u.role, u.active !== false]));
      return rows;
    }
    case 'coupons': {
      const rows = [['id', 'code', 'discountPercent', 'usedCount', 'usageLimit', 'validUntil', 'active']];
      ADMIN_STATE.cache.coupons.forEach(c => rows.push([
        c.id, c.code, c.discountPercent, c.usedCount, c.usageLimit, c.validUntil || '', c.active !== false
      ]));
      return rows;
    }
  }
  return null;
}

/* ─── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroSection').classList.remove('hidden');
  document.getElementById('authLink').onclick = () => showSection('auth');
  document.addEventListener('click', (e) => {
    const picker = document.getElementById('couponPicker');
    if (picker && !picker.contains(e.target)) closeCouponPicker();
  });
  const couponMenu = document.getElementById('couponPickerMenu');
  if (couponMenu) {
    couponMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.coupon-picker-item');
      if (item?.dataset.code) applyCoupon(item.dataset.code);
    });
  }
  loadCategories();

  if (jwtToken) {
    try {
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      if (payload.exp && Date.now() / 1000 < payload.exp) {
        fetch(`${API}/users/me`, { headers: authHeaders() })
          .then(r => { if (!r.ok) throw new Error(); return r.json(); })
          .then(user => {
            currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
            onLoginSuccess();
          })
          .catch(() => {
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
