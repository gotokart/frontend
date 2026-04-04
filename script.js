const API = 'https://backend-production-e13e2.up.railway.app/api';
let currentUser = null;
let allProducts = [];
let activeCategory = 'all';
let activeSearch = '';

// ===== CATEGORY DETECTION =====
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
      n.includes('stadium') || n.includes('bat') || n.includes('stumps') || n.includes('jersey')) return 'sports';

  if (n.includes('chair') || n.includes('sofa') || n.includes('bed') || n.includes('mattress') ||
      n.includes('pillow') || n.includes('blanket') || n.includes('lamp') || n.includes('bulb') ||
      n.includes('light') || n.includes('led') || n.includes('fan') || n.includes('cooler') ||
      n.includes('ac ') || n.includes(' ac') || n === 'ac' || n.includes('air conditioner') ||
      n.includes('airconditioner') || n.includes('air-conditioner') || n.includes('fridge') ||
      n.includes('refrigerator') || n.includes('washing machine') || n.includes('washer') ||
      n.includes('vacuum') || n.includes('broom') || n.includes('bucket') || n.includes('mirror') ||
      n.includes('clock') || n.includes('candle') || n.includes('curtain') || n.includes('towel') ||
      n.includes('furniture') || n.includes('decor') || n.includes('home') || n.includes('geyser') ||
      n.includes('water heater') || n.includes('microwave') || n.includes('oven') ||
      n.includes('mixer') || n.includes('grinder') || n.includes('juicer') || n.includes('toaster') ||
      n.includes('iron box') || n.includes('iron ') || n.includes(' iron') || n === 'iron' ||
      n.includes('inverter') || n.includes('stabilizer') || n.includes('heater') ||
      n.includes('air purifier') || n.includes('dishwasher') || n.includes('kettle') ||
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
      n.includes('highlighter pen') || n.includes('stapler') || n.includes('file') || n.includes('folder') ||
      n.includes('compass') || n.includes('geometry')) return 'books';

  if (n.includes('toy') || n.includes('doll') || n.includes('lego') || n.includes('puzzle') ||
      n.includes('game') || n.includes('playstation') || n.includes('xbox') || n.includes('nintendo') ||
      n.includes('remote control') || n.includes('teddy') || n.includes('board game') ||
      n.includes('chess') || n.includes('carrom') || n.includes('action figure') ||
      n.includes('rc car') || n.includes('rc plane')) return 'toys';

  return 'other';
}

// ===== EMOJI MAP =====
function productEmoji(name) {
  const n = (name || '').toLowerCase();

  // Electronics
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
  if (n.includes('pendrive') || n.includes('usb')) return '💾';
  if (n.includes('router') || n.includes('wifi') || n.includes('modem')) return '📡';

  // Clothing
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

  // Footwear
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('trainer')) return '👟';
  if (n.includes('boot')) return '🥾';
  if (n.includes('heel') || n.includes('stiletto')) return '👠';
  if (n.includes('sandal') || n.includes('slipper') || n.includes('chappal') || n.includes('flip flop') || n.includes('flipflop')) return '🩴';
  if (n.includes('loafer') || n.includes('oxford') || n.includes('moccasin')) return '👞';

  // Accessories
  if (n.includes('goggle') || n.includes('sunglasses') || n.includes('glasses') || n.includes('spectacle') || n.includes('chasma')) return '🕶️';
  if (n.includes('watch')) return '⌚';
  if (n.includes('ring')) return '💍';
  if (n.includes('necklace') || n.includes('chain') || n.includes('pendant') || n.includes('locket')) return '📿';
  if (n.includes('earring') || n.includes('jhumka')) return '💎';
  if (n.includes('bracelet') || n.includes('bangle') || n.includes('anklet')) return '📿';
  if (n.includes('belt')) return '🪢';
  if (n.includes('wallet') || n.includes('purse')) return '👛';
  if (n.includes('handbag') || n.includes('clutch')) return '👜';
  if (n.includes('backpack') || n.includes('rucksack')) return '🎒';
  if (n.includes('bag')) return '🛍️';
  if (n.includes('umbrella')) return '☂️';
  if (n.includes('luggage') || n.includes('suitcase')) return '🧳';
  if (n.includes('tie')) return '👔';

  // Beauty
  if (n.includes('nail paint') || n.includes('nailpaint') || n.includes('nail polish')) return '💅';
  if (n.includes('lipstick') || n.includes('lip gloss') || n.includes('lip balm')) return '💄';
  if (n.includes('perfume') || n.includes('cologne') || n.includes('deo') || n.includes('deodorant')) return '🧴';
  if (n.includes('mascara') || n.includes('eyeliner') || n.includes('kajal')) return '👁️';
  if (n.includes('shampoo') || n.includes('conditioner') || n.includes('hair oil') || n.includes('hair')) return '🧴';
  if (n.includes('soap') || n.includes('facewash') || n.includes('face wash') || n.includes('body wash')) return '🧼';
  if (n.includes('moisturizer') || n.includes('cream') || n.includes('lotion') || n.includes('serum') || n.includes('sunscreen')) return '🧴';
  if (n.includes('toothbrush') || n.includes('toothpaste')) return '🪥';
  if (n.includes('razor') || n.includes('trimmer')) return '🪒';
  if (n.includes('makeup') || n.includes('foundation') || n.includes('concealer') || n.includes('blush') || n.includes('highlighter')) return '🪞';

  // Bottles & containers
  if (n.includes('water bottle') || n.includes('sipper')) return '💧';
  if (n.includes('bottle') || n.includes('flask') || n.includes('thermos')) return '🍶';
  if (n.includes('jar') || n.includes('container')) return '🫙';
  if (n.includes('tiffin') || n.includes('lunchbox') || n.includes('lunch box')) return '🥡';

  // Books & stationery
  if (n.includes('book') || n.includes('novel') || n.includes('textbook')) return '📚';
  if (n.includes('pen') || n.includes('pencil') || n.includes('marker')) return '✏️';
  if (n.includes('notebook') || n.includes('diary') || n.includes('journal')) return '📓';
  if (n.includes('calculator')) return '🧮';
  if (n.includes('stapler')) return '📎';

  // Sports
  if (n.includes('cricket') || n.includes('bat') || n.includes('stumps')) return '🏏';
  if (n.includes('football') || n.includes('soccer')) return '⚽';
  if (n.includes('basketball')) return '🏀';
  if (n.includes('badminton') || n.includes('racket')) return '🏸';
  if (n.includes('tennis')) return '🎾';
  if (n.includes('volleyball')) return '🏐';
  if (n.includes('hockey')) return '🏑';
  if (n.includes('boxing') || n.includes('gloves')) return '🥊';
  if (n.includes('gym') || n.includes('dumbbell') || n.includes('weight') || n.includes('barbell')) return '🏋️';
  if (n.includes('yoga') || n.includes('mat')) return '🧘';
  if (n.includes('cycle') || n.includes('bicycle')) return '🚲';
  if (n.includes('treadmill')) return '🏃';
  if (n.includes('protein') || n.includes('supplement')) return '💪';
  if (n.includes('skipping') || n.includes('jump rope')) return '🪢';
  if (n.includes('jersey')) return '👕';

  // Home appliances — AC, Fridge etc.
  if (n.includes('ac ') || n.includes(' ac') || n === 'ac' ||
      n.includes('air conditioner') || n.includes('airconditioner') || n.includes('air-conditioner')) return '❄️';
  if (n.includes('fridge') || n.includes('refrigerator')) return '🧊';
  if (n.includes('washing machine') || n.includes('washer')) return '🫧';
  if (n.includes('microwave') || n.includes('oven')) return '📦';
  if (n.includes('geyser') || n.includes('water heater')) return '🚿';
  if (n.includes('mixer') || n.includes('grinder') || n.includes('juicer') || n.includes('blender')) return '🫙';
  if (n.includes('toaster')) return '🍞';
  if (n.includes('kettle')) return '☕';
  if (n.includes('induction')) return '🍳';
  if (n.includes('fan') || n.includes('cooler') || n.includes('air cooler')) return '💨';
  if (n.includes('iron box') || n.includes('iron ') || n.includes(' iron') || n === 'iron') return '👔';
  if (n.includes('heater') || n.includes('room heater')) return '🔥';
  if (n.includes('inverter') || n.includes('stabilizer')) return '🔌';
  if (n.includes('air purifier')) return '💨';
  if (n.includes('chimney') || n.includes('exhaust')) return '💨';
  if (n.includes('dishwasher')) return '🍽️';

  // Home furniture & decor
  if (n.includes('chair') || n.includes('sofa') || n.includes('couch')) return '🪑';
  if (n.includes('bed') || n.includes('mattress') || n.includes('pillow')) return '🛏️';
  if (n.includes('blanket') || n.includes('quilt') || n.includes('comforter')) return '🛌';
  if (n.includes('lamp') || n.includes('bulb') || n.includes('led') || n.includes('light')) return '💡';
  if (n.includes('clock') || n.includes('alarm')) return '⏰';
  if (n.includes('candle')) return '🕯️';
  if (n.includes('mirror')) return '🪞';
  if (n.includes('towel')) return '🧺';
  if (n.includes('broom') || n.includes('vacuum') || n.includes('mop')) return '🧹';
  if (n.includes('bucket')) return '🪣';
  if (n.includes('curtain')) return '🪟';

  // Toys & games
  if (n.includes('toy') || n.includes('doll') || n.includes('teddy')) return '🧸';
  if (n.includes('playstation') || n.includes('xbox') || n.includes('nintendo') || n.includes('game console')) return '🎮';
  if (n.includes('puzzle') || n.includes('jigsaw')) return '🧩';
  if (n.includes('chess') || n.includes('board game') || n.includes('carrom')) return '♟️';
  if (n.includes('lego')) return '🧱';

  // Food & kitchen
  if (n.includes('milk') || n.includes('dairy') || n.includes('paneer')) return '🥛';
  if (n.includes('coffee')) return '☕';
  if (n.includes('tea') || n.includes('chai')) return '🍵';
  if (n.includes('juice') || n.includes('drink')) return '🧃';
  if (n.includes('chocolate') || n.includes('candy') || n.includes('sweet')) return '🍫';
  if (n.includes('biscuit') || n.includes('cookie')) return '🍪';
  if (n.includes('chips') || n.includes('snack') || n.includes('namkeen')) return '🍟';
  if (n.includes('oil') || n.includes('ghee')) return '🫒';
  if (n.includes('rice') || n.includes('wheat') || n.includes('atta') || n.includes('flour')) return '🌾';
  if (n.includes('fruit') || n.includes('apple') || n.includes('mango') || n.includes('banana')) return '🍎';
  if (n.includes('vegetable') || n.includes('veggie') || n.includes('sabzi')) return '🥦';
  if (n.includes('bread')) return '🍞';
  if (n.includes('butter') || n.includes('cheese')) return '🧀';
  if (n.includes('egg')) return '🥚';
  if (n.includes('honey')) return '🍯';
  if (n.includes('noodle') || n.includes('pasta')) return '🍜';
  if (n.includes('dry fruit') || n.includes('nuts') || n.includes('almond') || n.includes('cashew')) return '🥜';
  if (n.includes('spice') || n.includes('masala')) return '🌶️';
  if (n.includes('salt') || n.includes('sugar')) return '🧂';
  if (n.includes('sauce') || n.includes('ketchup') || n.includes('pickle')) return '🫙';
  if (n.includes('plate') || n.includes('bowl') || n.includes('thali')) return '🍽️';
  if (n.includes('glass') || n.includes('cup') || n.includes('mug')) return '☕';
  if (n.includes('spoon') || n.includes('fork') || n.includes('spatula') || n.includes('ladle')) return '🥄';
  if (n.includes('pan') || n.includes('tawa') || n.includes('kadai') || n.includes('vessel') || n.includes('pot')) return '🍳';
  if (n.includes('knife') || n.includes('cutter')) return '🔪';

  // Health
  if (n.includes('medicine') || n.includes('capsule') || n.includes('tablet') && n.includes('mg') || n.includes('syrup')) return '💊';
  if (n.includes('bandage') || n.includes('plaster') || n.includes('first aid')) return '🩹';
  if (n.includes('thermometer')) return '🌡️';
  if (n.includes('mask')) return '😷';

  // Pet
  if (n.includes('pet food') || n.includes('dog food') || n.includes('cat food')) return '🐾';

  return '📦';
}

// ===== SPINNER =====
function showSpinner(msg = 'Loading...') {
  document.getElementById('spinnerText').textContent = msg;
  document.getElementById('spinnerOverlay').classList.remove('hidden');
}
function hideSpinner() { document.getElementById('spinnerOverlay').classList.add('hidden'); }

// ===== TOAST =====
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => t.className = 'toast', 3500);
}

// ===== ORDER MODAL =====
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

// ===== NAVIGATION =====
function showSection(name) {
  ['hero', 'auth', 'products', 'cart', 'orders'].forEach(s => {
    const el = document.getElementById(s + 'Section');
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target = document.getElementById(name + 'Section');
  if (target) target.classList.remove('hidden');
  if (name === 'products') { loadProducts(); document.querySelectorAll('.nav-link')[0].classList.add('active'); }
  if (name === 'cart')     { loadCart();     document.querySelectorAll('.nav-link')[1].classList.add('active'); }
  if (name === 'orders')   { loadOrders();   document.querySelectorAll('.nav-link')[2].classList.add('active'); }
  if (name === 'auth')     { document.querySelectorAll('.nav-link')[3].classList.add('active'); }
}

// ===== AUTH =====
function switchTab(tab) {
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

function loginUser() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!email || !password) return toast('Please enter email and password', 'error');
  showSpinner('Logging you in...');
  fetch(`${API}/users`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(users => {
      hideSpinner();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) { toast('Invalid email or password', 'error'); return; }
      setLoggedInUser(user);
    })
    .catch(() => { hideSpinner(); toast('Login failed.', 'error'); });
}

function setLoggedInUser(user) {
  currentUser = user;
  document.getElementById('authLink').textContent = user.name || `User #${user.id}`;
  document.getElementById('authLink').onclick = (e) => e.preventDefault();
  document.getElementById('logoutBtn').classList.remove('hidden');
  updateCartBadge();
  toast(`Welcome back, ${user.name || 'User'}! 👋`);
  showSection('products');
}

function logoutUser() {
  currentUser = null;
  document.getElementById('authLink').textContent = 'Login';
  document.getElementById('authLink').onclick = () => showSection('auth');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('cartBadge').textContent = '0';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  toast('Logged out successfully 👋');
  showSection('hero');
}

function registerUser() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  if (!name || !email || !password) return toast('Please fill all fields', 'error');
  showSpinner('Creating your account...');
  fetch(`${API}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(user => {
      hideSpinner();
      toast(`Account created! Welcome, ${user.name}! 🎉`);
      ['regName','regEmail','regPassword'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = password;
      switchTab('login');
    })
    .catch(() => { hideSpinner(); toast('Registration failed.', 'error'); });
}

// ===== PRODUCTS =====
function loadProducts() {
  showSpinner('Fetching products...');
  fetch(`${API}/products`)
    .then(r => r.json())
    .then(products => {
      hideSpinner();
      allProducts = products;
      applyFilters();
    })
    .catch(() => { hideSpinner(); toast('Could not load products', 'error'); });
}

function filterByCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  applyFilters();
}

function filterProducts() {
  activeSearch = document.getElementById('searchInput').value.trim().toLowerCase();
  const clearBtn = document.getElementById('searchClear');
  clearBtn.classList.toggle('hidden', !activeSearch);
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
    filtered = filtered.filter(p => getCategory(p.name) === activeCategory);
  }

  if (activeSearch) {
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(activeSearch) ||
      (p.description || '').toLowerCase().includes(activeSearch)
    );
  }

  const stockFilter = document.getElementById('stockFilter')?.value;
  if (stockFilter === 'instock') filtered = filtered.filter(p => p.stock > 0);
  if (stockFilter === 'outstock') filtered = filtered.filter(p => p.stock <= 0);

  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price-low') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'price-high') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === 'name-az') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (sort === 'name-za') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
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
      <div class="product-actions">
        <button class="btn-delete-product" onclick="deleteProduct(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}')">🗑️ Remove Product</button>
      </div>
    </div>
  `).join('');
}

function deleteProduct(productId, productName) {
  if (!confirm(`Remove "${productName}" from the store?`)) return;
  showSpinner('Removing product...');
  fetch(`${API}/products/${productId}`, { method: 'DELETE' })
    .then(r => {
      hideSpinner();
      if (!r.ok) throw new Error();
      toast(`"${productName}" removed ✅`);
      loadProducts();
    })
    .catch(() => { hideSpinner(); toast('Failed to remove product', 'error'); });
}

function toggleAdminPanel() {
  document.getElementById('adminPanel').classList.toggle('hidden');
}

function addProduct() {
  const name        = document.getElementById('pName').value.trim();
  const description = document.getElementById('pDesc').value.trim();
  const price       = parseFloat(document.getElementById('pPrice').value);
  const stock       = parseInt(document.getElementById('pStock').value);
  if (!name || !price || !stock) return toast('Please fill all product fields', 'error');
  showSpinner('Saving product...');
  fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, price, stock })
  })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(() => {
      hideSpinner();
      toast(`${productEmoji(name)} "${name}" saved! ✅`);
      ['pName','pDesc','pPrice','pStock'].forEach(id => document.getElementById(id).value = '');
      loadProducts();
    })
    .catch(() => { hideSpinner(); toast('Failed to save product', 'error'); });
}

// ===== CART =====
function addToCart(productId) {
  if (!currentUser) return toast('Please login first 🔐', 'error');
  const qty = parseInt(document.getElementById(`qty-${productId}`).value) || 1;
  const btn = document.querySelector(`[onclick="addToCart(${productId})"]`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  fetch(`${API}/cart/${currentUser.id}/add?productId=${productId}&quantity=${qty}`, { method: 'POST' })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(() => {
      toast('Added to cart! 🛒');
      updateCartBadge();
      if (btn) { btn.disabled = false; btn.textContent = '🛒 Add'; }
    })
    .catch(() => {
      toast('Failed to add to cart', 'error');
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
  fetch(`${API}/cart/${currentUser.id}`)
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

function changeCartQty(productId, cartItemId, currentQty, delta) {
  if (!currentUser) return;
  const newQty = currentQty + delta;
  if (newQty <= 0) { removeFromCart(productId, cartItemId); return; }

  const minusBtn = document.querySelector(`#cart-item-${cartItemId} .stepper-btn:first-child`);
  const plusBtn  = document.querySelector(`#cart-item-${cartItemId} .stepper-btn:last-child`);
  if (minusBtn) minusBtn.disabled = true;
  if (plusBtn)  plusBtn.disabled  = true;

  fetch(`${API}/cart/${currentUser.id}/remove?productId=${productId}`, { method: 'DELETE' })
    .then(r => { if (!r.ok) throw new Error(); })
    .then(() => fetch(`${API}/cart/${currentUser.id}/add?productId=${productId}&quantity=${newQty}`, { method: 'POST' }))
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(() => fetch(`${API}/cart/${currentUser.id}`))
    .then(r => r.json())
    .then(items => { renderCart(items); document.getElementById('cartBadge').textContent = items.length; })
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
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    if (!response.ok) throw new Error('Delete failed: ' + response.status);
    toast('Item removed 🗑️');
    return fetch(`${API}/cart/${currentUser.id}`);
  })
  .then(r => r.json())
  .then(items => { renderCart(items); document.getElementById('cartBadge').textContent = items.length; })
  .catch(err => {
    console.error('Remove error:', err);
    toast('Remove failed', 'error');
    if (btn)  { btn.disabled = false; btn.textContent = 'Remove'; }
    if (item) item.style.opacity = '1';
  });
}

function updateCartBadge() {
  if (!currentUser) return;
  fetch(`${API}/cart/${currentUser.id}`)
    .then(r => r.json())
    .then(items => { document.getElementById('cartBadge').textContent = items.length; })
    .catch(() => {});
}

// ===== PLACE ORDER =====
function placeOrder() {
  if (!currentUser) return toast('Please login first', 'error');
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing Order...';
  showSpinner('Placing your order...');

  fetch(`${API}/orders/${currentUser.id}/place`, { method: 'POST' })
    .then(r => {
      if (!r.ok) return r.text().then(t => { throw new Error(t || r.status); });
      return r.json();
    })
    .then(order => {
      hideSpinner();
      btn.disabled = false;
      btn.textContent = 'Place Order →';
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
      btn.disabled = false;
      btn.textContent = 'Place Order →';
      console.error('Order error:', err);
      toast(`Order failed: ${err.message}`, 'error');
    });
}

// ===== ORDERS =====
function loadOrders() {
  if (!currentUser) {
    document.getElementById('ordersContent').innerHTML = '<div class="empty-state">🔐 Please login to view your orders</div>';
    return;
  }
  showSpinner('Fetching your orders...');
  fetch(`${API}/orders/${currentUser.id}`)
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroSection').classList.remove('hidden');
  document.getElementById('authLink').onclick = () => showSection('auth');
});