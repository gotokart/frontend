const API = 'http://localhost:8080/api';
let currentUser = null;
let allProducts = [];

// ===== UTILS =====
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => t.className = 'toast', 3000);
}

function showSection(name) {
  ['hero', 'auth', 'products', 'cart', 'orders'].forEach(s => {
    const el = document.getElementById(s + 'Section');
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById(name + 'Section');
  if (target) target.classList.remove('hidden');

  if (name === 'products') { loadProducts(); document.querySelectorAll('.nav-link')[0].classList.add('active'); }
  if (name === 'cart') { loadCart(); document.querySelectorAll('.nav-link')[1].classList.add('active'); }
  if (name === 'orders') { loadOrders(); document.querySelectorAll('.nav-link')[2].classList.add('active'); }
  if (name === 'auth') document.querySelectorAll('.nav-link')[3].classList.add('active');
}

function productEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('phone') || n.includes('iphone') || n.includes('mobile')) return '📱';
  if (n.includes('laptop') || n.includes('mac') || n.includes('computer')) return '💻';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('boot')) return '👟';
  if (n.includes('shirt') || n.includes('cloth') || n.includes('tshirt')) return '👕';
  if (n.includes('watch')) return '⌚';
  if (n.includes('book')) return '📚';
  if (n.includes('headphone') || n.includes('earphone') || n.includes('audio')) return '🎧';
  if (n.includes('camera')) return '📷';
  if (n.includes('tv') || n.includes('television')) return '📺';
  if (n.includes('bag') || n.includes('backpack')) return '🎒';
  return '📦';
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
  const id = document.getElementById('loginUserId').value.trim();
  if (!id) return toast('Please enter your user ID', 'error');

  fetch(`${API}/users/${id}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(user => {
      currentUser = user;
      document.getElementById('authLink').textContent = user.name || `User #${user.id}`;
      toast(`Welcome back, ${user.name || 'User'}! 👋`);
      showSection('products');
    })
    .catch(() => toast('User not found. Please register first.', 'error'));
}

function registerUser() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  if (!name || !email || !password) return toast('Please fill all fields', 'error');

  fetch(`${API}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
    .then(r => r.json())
    .then(user => {
      toast(`Account created! Your ID is ${user.id} — save it for login! 🎉`);
      document.getElementById('regName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPassword').value = '';
      switchTab('login');
      document.getElementById('loginUserId').value = user.id;
    })
    .catch(() => toast('Registration failed', 'error'));
}

// ===== PRODUCTS =====
function loadProducts() {
  fetch(`${API}/products`)
    .then(r => r.json())
    .then(products => {
      allProducts = products;
      renderProducts(products);
    })
    .catch(() => toast('Could not load products', 'error'));
}

function filterProducts() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q)
  );
  renderProducts(filtered);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<div class="empty-state">No products found</div>';
    return;
  }
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.05}s">
      <span class="product-emoji">${productEmoji(p.name)}</span>
      <div class="product-name">${p.name || 'Unnamed Product'}</div>
      <div class="product-desc">${p.description || 'No description available'}</div>
      <div class="product-footer">
        <div class="product-price">₹${(p.price || 0).toLocaleString('en-IN')}</div>
        <div class="product-stock">${p.stock || 0} left</div>
      </div>
      <div class="qty-row">
        <input type="number" class="qty-input" id="qty-${p.id}" value="1" min="1" max="${p.stock || 99}"/>
        <button class="btn-cart" onclick="addToCart(${p.id})">🛒 Add to Cart</button>
      </div>
    </div>
  `).join('');
}

function addProduct() {
  const name = document.getElementById('pName').value.trim();
  const description = document.getElementById('pDesc').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const stock = parseInt(document.getElementById('pStock').value);

  if (!name || !price || !stock) return toast('Please fill all product fields', 'error');

  fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, price, stock })
  })
    .then(r => r.json())
    .then(() => {
      toast('Product added successfully! ✅');
      document.getElementById('pName').value = '';
      document.getElementById('pDesc').value = '';
      document.getElementById('pPrice').value = '';
      document.getElementById('pStock').value = '';
      loadProducts();
    })
    .catch(() => toast('Failed to add product', 'error'));
}

// ===== CART =====
function addToCart(productId) {
  if (!currentUser) return toast('Please login first to add items to cart 🔐', 'error');
  const qty = parseInt(document.getElementById(`qty-${productId}`).value) || 1;

  fetch(`${API}/cart/${currentUser.id}/add?productId=${productId}&quantity=${qty}`, {
    method: 'POST'
  })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(() => {
      toast('Added to cart! 🛒');
      updateCartBadge();
    })
    .catch(() => toast('Failed to add to cart', 'error'));
}

function loadCart() {
  if (!currentUser) {
    document.getElementById('cartContent').innerHTML = '<div class="empty-state">🔐 Please login to view your cart</div>';
    document.getElementById('cartFooter').style.display = 'none';
    return;
  }

  fetch(`${API}/cart/${currentUser.id}`)
    .then(r => r.json())
    .then(items => {
      if (!items.length) {
        document.getElementById('cartContent').innerHTML = '<div class="empty-state">🛒 Your cart is empty</div>';
        document.getElementById('cartFooter').style.display = 'none';
        return;
      }
      const total = items.reduce((sum, i) => sum + ((i.product?.price || 0) * (i.quantity || 1)), 0);
      document.getElementById('cartContent').innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${productEmoji(item.product?.name)} ${item.product?.name || 'Product'}</div>
            <div class="cart-item-price">₹${(item.product?.price || 0).toLocaleString('en-IN')} × ${item.quantity}</div>
            <div class="cart-item-qty">Subtotal: ₹${((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</div>
          </div>
          <button class="btn-danger" onclick="removeFromCart(${item.product?.id})">Remove</button>
        </div>
      `).join('');
      document.getElementById('cartTotal').innerHTML = `Total: <span>₹${total.toLocaleString('en-IN')}</span>`;
      document.getElementById('cartFooter').style.display = 'flex';
    })
    .catch(() => toast('Could not load cart', 'error'));
}

function removeFromCart(productId) {
  fetch(`${API}/cart/${currentUser.id}/remove?productId=${productId}`, { method: 'DELETE' })
    .then(() => { toast('Item removed'); loadCart(); updateCartBadge(); })
    .catch(() => toast('Failed to remove item', 'error'));
}

function updateCartBadge() {
  if (!currentUser) return;
  fetch(`${API}/cart/${currentUser.id}`)
    .then(r => r.json())
    .then(items => {
      document.getElementById('cartBadge').textContent = items.length;
    })
    .catch(() => {});
}

// ===== ORDERS =====
function placeOrder() {
  if (!currentUser) return toast('Please login first', 'error');
  fetch(`${API}/orders/${currentUser.id}/place`, { method: 'POST' })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(order => {
      toast(`Order #${order.id} placed successfully! 🎉`);
      updateCartBadge();
      showSection('orders');
    })
    .catch(() => toast('Failed to place order. Is your cart empty?', 'error'));
}

function loadOrders() {
  if (!currentUser) {
    document.getElementById('ordersContent').innerHTML = '<div class="empty-state">🔐 Please login to view your orders</div>';
    return;
  }
  fetch(`${API}/orders/${currentUser.id}`)
    .then(r => r.json())
    .then(orders => {
      if (!orders.length) {
        document.getElementById('ordersContent').innerHTML = '<div class="empty-state">📦 No orders yet</div>';
        return;
      }
      document.getElementById('ordersContent').innerHTML = orders.map(o => `
        <div class="order-card">
          <div class="order-header">
            <div>
              <div class="order-id">Order #${o.id}</div>
              <div class="order-date">${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : 'N/A'}</div>
            </div>
            <span class="order-status">${o.status || 'PLACED'}</span>
          </div>
          <div class="order-total">₹${(o.totalAmount || 0).toLocaleString('en-IN')}</div>
        </div>
      `).join('');
    })
    .catch(() => toast('Could not load orders', 'error'));
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Hero is shown by default
  document.getElementById('heroSection').classList.remove('hidden');
});
