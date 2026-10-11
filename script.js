
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 1499,
    rating: 4.8,
    tag: "Popular",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
  },
  {
    id: 2,
    name: "Smart Watch",
    category: "Electronics",
    price: 2499,
    rating: 4.6,
    tag: "Trending",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
  },
  {
    id: 3,
    name: "Running Shoes",
    category: "Fashion",
    price: 1899,
    rating: 4.7,
    tag: "Best Seller",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
  },
  {
    id: 4,
    name: "Classic Backpack",
    category: "Accessories",
    price: 999,
    rating: 4.5,
    tag: "Value Pick",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"
  },
  {
    id: 5,
    name: "Digital Camera",
    category: "Electronics",
    price: 4599,
    rating: 4.9,
    tag: "Premium",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500"
  },
  {
    id: 6,
    name: "Sunglasses",
    category: "Accessories",
    price: 799,
    rating: 4.4,
    tag: "New",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"
  },
  {
    id: 7,
    name: "Casual T-Shirt",
    category: "Fashion",
    price: 599,
    rating: 4.3,
    tag: "Everyday",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
  },
  {
    id: 8,
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: 1299,
    rating: 4.6,
    tag: "Popular",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"
  }
];

// Shopping cart stores product IDs and quantities.
const cart = new Map();

const productGrid = document.getElementById("productGrid");
const cartItems = document.getElementById("cartItems");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const money = amount =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  });

let couponApplied = false;
let toastTimer;

// Display products
function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  document.getElementById("noProducts").hidden =
    filteredProducts.length !== 0;

  productGrid.innerHTML = filteredProducts.map(product => `
    <article class="product-card">
      <div class="product-image">
        <span class="tag">${product.tag}</span>
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
      </div>

      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="product-rating">
          ★ ${product.rating} <span style="color:#737d90">/ 5</span>
        </p>

        <div class="product-bottom">
          <span class="price">${money(product.price)}</span>
          <button class="add-btn" data-add="${product.id}">
            + Add
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

// Add product to cart
function addToCart(id) {
  const quantity = cart.get(id) || 0;
  cart.set(id, quantity + 1);

  renderCart();
  showToast("Product added to cart!");
}

// Change quantity or remove item
function changeQuantity(id, amount) {
  const currentQuantity = cart.get(id) || 0;
  const newQuantity = currentQuantity + amount;

  if (newQuantity <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, newQuantity);
  }

  renderCart();
}

function removeItem(id) {
  cart.delete(id);
  renderCart();
  showToast("Product removed from cart.");
}

// Calculate and display cart
function renderCart() {
  const entries = [...cart.entries()];

  const totalQuantity = entries.reduce(
    (sum, [, quantity]) => sum + quantity, 0
  );

  document.getElementById("cartCount").textContent = totalQuantity;

  if (entries.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <span>🛒</span>
        <h3>Your cart is empty</h3>
        <p>Add products to see them here.</p>
      </div>
    `;
  } else {
    cartItems.innerHTML = entries.map(([id, quantity]) => {
      const product = products.find(item => item.id === id);

      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}"
            onerror="this.style.display='none'">

          <div>
            <h3>${product.name}</h3>
            <p class="item-price">${money(product.price)}</p>

            <div class="quantity">
              <button data-change="${id}" data-amount="-1"
                aria-label="Decrease quantity">−</button>

              <span>${quantity}</span>

              <button data-change="${id}" data-amount="1"
                aria-label="Increase quantity">+</button>
            </div>

            <button class="remove-btn" data-remove="${id}">
              Remove
            </button>
          </div>

          <div class="item-total">
            ${money(product.price * quantity)}
          </div>
        </div>
      `;
    }).join("");
  }

  // Subtotal before discount, tax and delivery
  const subtotal = entries.reduce((sum, [id, quantity]) => {
    const product = products.find(item => item.id === id);
    return sum + product.price * quantity;
  }, 0);

  // Automatic discount: 10% for orders above ₹2,000
  let discount = subtotal > 2000 ? subtotal * 0.10 : 0;

  // Coupon SAVE10: an additional 10% discount
  // on the remaining subtotal, if eligible.
  if (couponApplied && subtotal > 0) {
    discount += (subtotal - discount) * 0.10;
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * 0.05;

  // Free delivery when original subtotal is ₹999 or more
  const delivery = subtotal === 0 || subtotal >= 999 ? 0 : 49;

  const total = taxableAmount + tax + delivery;

  document.getElementById("subtotal").textContent = money(subtotal);
  document.getElementById("discount").textContent = "− " + money(discount);
  document.getElementById("tax").textContent = money(tax);
  document.getElementById("delivery").textContent = money(delivery);
  document.getElementById("total").textContent = money(total);

  document.getElementById("checkoutBtn").disabled =
    totalQuantity === 0;

  document.getElementById("clearCart").disabled =
    totalQuantity === 0;

  document.getElementById("couponMessage").textContent =
    couponApplied ? "Coupon SAVE10 applied!" : "";
}

// Coupon functionality
document.getElementById("applyCoupon").addEventListener("click", () => {
  const code = document.getElementById("couponInput")
    .value.trim().toUpperCase();

  const message = document.getElementById("couponMessage");

  if (code === "SAVE10") {
    if (cart.size === 0) {
      message.textContent = "Add a product before applying the coupon.";
      couponApplied = false;
    } else {
      couponApplied = true;
      message.textContent = "Coupon applied successfully!";
      showToast("SAVE10 coupon applied!");
    }
  } else {
    couponApplied = false;
    message.textContent = "Invalid code. Try SAVE10.";
  }

  renderCart();

  // Show invalid-code message after cart rendering
  if (code !== "SAVE10") {
    message.textContent = "Invalid code. Try SAVE10.";
  } else if (cart.size === 0) {
    message.textContent = "Add a product before applying the coupon.";
  }
});

// Product buttons
productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");

  if (button) {
    addToCart(Number(button.dataset.add));
  }
});

// Cart quantity and remove buttons
cartItems.addEventListener("click", event => {
  const changeButton = event.target.closest("[data-change]");
  const removeButton = event.target.closest("[data-remove]");

  if (changeButton) {
    changeQuantity(
      Number(changeButton.dataset.change),
      Number(changeButton.dataset.amount)
    );
  }

  if (removeButton) {
    removeItem(Number(removeButton.dataset.remove));
  }
});

// Search and category filters
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

document.getElementById("searchBtn").addEventListener("click", () => {
  renderProducts();
  document.getElementById("products").scrollIntoView({
    behavior: "smooth"
  });
});

// Clear cart
document.getElementById("clearCart").addEventListener("click", () => {
  cart.clear();
  couponApplied = false;
  document.getElementById("couponInput").value = "";

  renderCart();
  showToast("Cart cleared.");
});

// Frontend-only checkout demonstration
document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (cart.size === 0) return;

  alert(
    "Order Summary\n\n" +
    "Items: " + [...cart.values()].reduce((a, b) => a + b, 0) +
    "\nTotal: " + document.getElementById("total").textContent +
    "\n\nThis is a frontend demo. No actual order or payment was made."
  );
});

// Small notification
function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Initial page rendering
renderProducts();
renderCart();
