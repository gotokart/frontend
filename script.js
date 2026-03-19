const BASE_URL = "http://localhost:8080/api";
const USER_ID = 1; // static user

// 👤 Register User
async function registerUser() {
    const user = {
        name: document.getElementById("username").value,
        email: document.getElementById("email").value
    };

    const res = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(user)
    });

    const data = await res.json();
    alert("User Registered ✅");
    console.log(data);
}

// 📦 Add Product
async function addProduct() {
    const product = {
        name: document.getElementById("name").value,
        price: document.getElementById("price").value,
        stock: document.getElementById("stock").value
    };

    const res = await fetch(`${BASE_URL}/products`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(product)
    });

    const data = await res.json();
    alert("Product Added ✅");
    loadProducts();
}

// 🛍️ Load Products
async function loadProducts() {
    const res = await fetch(`${BASE_URL}/products`);
    const products = await res.json();

    const list = document.getElementById("productList");
    list.innerHTML = "";

    products.forEach(p => {
        list.innerHTML += `
            <div class="product">
                <b>${p.name}</b> - ₹${p.price} 
                <button onclick="addToCart(${p.id})">Add</button>
                <button onclick="deleteProduct(${p.id})">Delete</button>
            </div>
        `;
    });
}

// ❌ Delete Product
async function deleteProduct(id) {
    await fetch(`${BASE_URL}/products/${id}`, {
        method: "DELETE"
    });

    alert("Deleted ❌");
    loadProducts();
}

// 🛒 Add to Cart
async function addToCart(productId) {
    await fetch(`${BASE_URL}/cart/${USER_ID}/add?productId=${productId}&quantity=1`, {
        method: "POST"
    });

    alert("Added to cart 🛒");
}

// 👀 View Cart
async function viewCart() {
    const res = await fetch(`${BASE_URL}/cart/${USER_ID}`);
    const items = await res.json();

    const list = document.getElementById("cartList");
    list.innerHTML = "";

    items.forEach(i => {
        list.innerHTML += `
            <div class="cart-item">
                Product ID: ${i.product.id} | Qty: ${i.quantity}
            </div>
        `;
    });
}

// 📦 Place Order
async function placeOrder() {
    const res = await fetch(`${BASE_URL}/orders/${USER_ID}/place`, {
        method: "POST"
    });

    const data = await res.json();
    alert("Order Placed ✅");
    console.log(data);
}

// 📦 View Orders
async function viewOrders() {
    const res = await fetch(`${BASE_URL}/orders/${USER_ID}`);
    const orders = await res.json();

    const list = document.getElementById("orderList");
    list.innerHTML = "";

    orders.forEach(o => {
        list.innerHTML += `
            <div class="order">
                Order ID: ${o.id} | Amount: ₹${o.totalAmount} | Status: ${o.status}
            </div>
        `;
    });
}