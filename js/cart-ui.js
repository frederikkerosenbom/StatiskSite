// =======================
// CART STORAGE (localStorage)
// =======================
const CART_KEY = "cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === productId);

  if (existing) existing.qty += qty;
  else cart.push({ id: productId, qty });

  saveCart(cart);
  updateCartCountUI();
}

function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.id !== productId);
  saveCart(cart);
  updateCartCountUI();
}

function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.qty = qty;
  if (item.qty <= 0) {
    saveCart(cart.filter((i) => i.id !== productId));
  } else {
    saveCart(cart);
  }

  updateCartCountUI();
}

function clearCart() {
  saveCart([]);
  updateCartCountUI();
}

// =======================
// CART UI (slide-in panel)
// =======================
const cartPanel = document.querySelector("#cartPanel");
const cartOverlay = document.querySelector("#cartOverlay");
const cartOpenBtn = document.querySelector("#cartOpenBtn");
const cartCloseBtn = document.querySelector("#cartCloseBtn");
const cartClearBtn = document.querySelector("#cartClearBtn");

const cartItemsEl = document.querySelector("#cartItems");
const cartTotalEl = document.querySelector("#cartTotal");
const cartCountEl = document.querySelector("#cartCount");

function openCart() {
  cartPanel.classList.add("isOpen");
  cartOverlay.classList.add("isOpen");
  cartPanel.setAttribute("aria-hidden", "false");
  cartOverlay.setAttribute("aria-hidden", "false");
  renderCartPanel();
}

function closeCart() {
  cartPanel.classList.remove("isOpen");
  cartOverlay.classList.remove("isOpen");
  cartPanel.setAttribute("aria-hidden", "true");
  cartOverlay.setAttribute("aria-hidden", "true");
}

function updateCartCountUI() {
  if (!cartCountEl) return;
  cartCountEl.textContent = cartCount();
}

async function fetchProduct(id) {
  const res = await fetch(`https://kea-alt-del.dk/t7/api/products/${id}`);
  return res.json();
}

function calcDiscountPrice(price, discount) {
  return Math.round((price * (100 - discount)) / 100);
}

async function renderCartPanel() {
  const cart = getCart();

  if (!cartItemsEl || !cartTotalEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p>Din kurv er tom.</p>`;
    cartTotalEl.textContent = "";
    return;
  }

  const products = await Promise.all(cart.map((item) => fetchProduct(item.id)));

  let total = 0;

  cartItemsEl.innerHTML = products
    .map((p) => {
      const item = cart.find((c) => c.id === p.id);
      const qty = item.qty;

      const hasDiscount = p.discount !== null;
      const unitPrice = hasDiscount ? calcDiscountPrice(p.price, p.discount) : p.price;

      const lineTotal = unitPrice * qty;
      total += lineTotal;

      return `
        <div class="cartItem">
          <img src="https://kea-alt-del.dk/t7/images/webp/640/${p.id}.webp" alt="${p.productdisplayname}">
          <div>
            <h4>${p.productdisplayname}</h4>
            <p>${unitPrice} DKK ${hasDiscount ? `<span class="discountText">(-${p.discount}%)</span>` : ""}</p>

            <div class="cartRow">
              <label>
                Antal:
                <input class="cartQty" type="number" min="1" value="${qty}" data-qty="${p.id}">
              </label>
              <button class="cartRemoveBtn" type="button" data-remove="${p.id}">Fjern</button>
            </div>

            <p><strong>Linje:</strong> ${lineTotal} DKK</p>
          </div>
        </div>
      `;
    })
    .join("");

  cartTotalEl.textContent = `Total: ${total} DKK`;

  // qty change
  cartItemsEl.querySelectorAll("[data-qty]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = Number(input.dataset.qty);
      const qty = Number(input.value);
      updateQty(id, qty);
      renderCartPanel();
      updateCartCountUI();
    });
  });

  // remove
  cartItemsEl.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(Number(btn.dataset.remove));
      renderCartPanel();
      updateCartCountUI();
    });
  });
}

// =======================
// EVENTS
// =======================
if (cartOpenBtn) {
  cartOpenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });
}

if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

if (cartClearBtn) {
  cartClearBtn.addEventListener("click", () => {
    clearCart();
    renderCartPanel();
    closeCart();
  });
}

// ESC to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

// Init count on load
updateCartCountUI();

// Make addToCart available for other scripts
window.addToCart = addToCart;
window.openCart = openCart;
window.updateCartCountUI = updateCartCountUI;
