const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem("ife_cart") || "[]")
};


// ===============================
// HELPERS
// ===============================

function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}


function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}


// ===============================
// LOAD PRODUCTS FROM SUPABASE
// ===============================

async function loadProducts() {

  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("empty");

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_PUBLISHABLE_KEY ||
    window.SUPABASE_URL.includes("YOUR-PROJECT") ||
    window.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
  ) {

    grid.innerHTML = "";

    empty.hidden = false;

    empty.innerHTML = `
      <h3>Products coming soon.</h3>
      <p>We're preparing the Ife Aesthetics collection.</p>
    `;

    return;
  }


  try {

    const response = await fetch(
      `${window.SUPABASE_URL}/rest/v1/ife_products?select=*&archived=eq.false&order=created_at.desc`,
      {
        headers: {
          apikey: window.SUPABASE_PUBLISHABLE_KEY,
          Authorization:
            `Bearer ${window.SUPABASE_PUBLISHABLE_KEY}`
        }
      }
    );


    if (!response.ok) {
      throw new Error("Unable to load products");
    }


    state.products = await response.json();

    renderProducts("All");

  } catch (error) {

    console.error(error);

    grid.innerHTML = "";

    empty.hidden = false;

    empty.innerHTML = `
      <h3>Our collection is loading.</h3>
      <p>Please try again shortly.</p>
    `;
  }
}


// ===============================
// DISPLAY PRODUCTS
// ===============================

function renderProducts(filter = "All") {

  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("empty");


  const products =
    filter === "All"
      ? state.products
      : state.products.filter(
          product => product.category === filter
        );


  grid.innerHTML = products.map(product => {

    const image =
      product.image_url ||
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80";


    return `
      <article class="product-card">

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
        >

        <div class="product-info">

          <p>
            ${escapeHTML(product.category || "Ife Aesthetics")}
          </p>

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <p>
            ${escapeHTML(product.description || "")}
          </p>

          <div class="product-price">
            ${formatMoney(product.price)}
          </div>

          <button
            class="add-to-cart"
            data-id="${escapeHTML(product.id)}"
          >
            Add to bag
          </button>

        </div>

      </article>
    `;

  }).join("");


  empty.hidden = products.length > 0;
}


// ===============================
// CART
// ===============================

function addToCart(productId) {

  const product =
    state.products.find(
      item => String(item.id) === String(productId)
    );


  if (!product) return;  if (Number(product.stock) <= 0) {   alert("Sorry, this product is currently out of stock.");   return; }


  state.cart.push(product);

  saveCart();

  renderCart();

  document
    .getElementById("cartPanel")
    .classList.add("open");
}


function removeFromCart(index) {

  state.cart.splice(index, 1);

  saveCart();

  renderCart();
}


function saveCart() {

  localStorage.setItem(
    "ife_cart",
    JSON.stringify(state.cart)
  );


  document.getElementById("cartCount").textContent =
    state.cart.length;
}


// ===============================
// DISPLAY CART
// ===============================

function renderCart() {

  const container =
    document.getElementById("cartItems");


  if (!state.cart.length) {

    container.innerHTML = `
      <p>Your bag is empty.</p>
    `;

  } else {

    container.innerHTML =
      state.cart.map((product, index) => {

        const image =
          product.image_url ||
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80";


        return `
          <div class="cart-row">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
            >

            <div>

              <strong>
                ${escapeHTML(product.name)}
              </strong>

              <p>
                ${formatMoney(product.price)}
              </p>

              <button
                onclick="removeFromCart(${index})"
              >
                Remove
              </button>

            </div>

          </div>
        `;

      }).join("");
  }


  const total =
    state.cart.reduce(
      (sum, product) =>
        sum + Number(product.price || 0),
      0
    );


  document.getElementById("cartTotal").textContent =
    formatMoney(total);


  saveCart();
}


// ===============================
// WHATSAPP CHECKOUT
// ===============================

function checkoutWhatsApp() {

  if (!state.cart.length) {

    alert("Your bag is empty.");

    return;
  }


  const total =
    state.cart.reduce(
      (sum, product) =>
        sum + Number(product.price || 0),
      0
    );


  const products =
    state.cart.map(product =>
      `• ${product.name} — ${formatMoney(product.price)}`
    ).join("\n");


  const message = `
Hello Ife Aesthetics 👋

I would like to place an order.

PRODUCTS
${products}

TOTAL
${formatMoney(total)}

Please confirm availability and delivery details.

Thank you.
  `.trim();


  const whatsappURL =
    `https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


  window.open(
    whatsappURL,
    "_blank"
  );
}


// ===============================
// EVENTS
// ===============================

document.addEventListener("click", event => {


  // Add to cart

  if (
    event.target.matches(".add-to-cart")
  ) {

    addToCart(
      event.target.dataset.id
    );

  }


  // Product filters

  if (
    event.target.matches(".filter")
  ) {

    document
      .querySelectorAll(".filter")
      .forEach(button =>
        button.classList.remove("active")
      );


    event.target.classList.add("active");


    renderProducts(
      event.target.dataset.filter
    );
  }


  // Category cards

  if (
    event.target.closest(".category-card")
  ) {

    const card =
      event.target.closest(".category-card");


    const filter =
      card.dataset.filter;


    setTimeout(() => {

      document
        .querySelectorAll(".filter")
        .forEach(button => {

          button.classList.toggle(
            "active",
            button.dataset.filter === filter
          );

        });


      renderProducts(filter);

    }, 50);
  }

});


// ===============================
// CART BUTTONS
// ===============================

document.getElementById("cartBtn")
  .addEventListener("click", () => {

    document
      .getElementById("cartPanel")
      .classList.add("open");

  });


document.getElementById("closeCart")
  .addEventListener("click", () => {

    document
      .getElementById("cartPanel")
      .classList.remove("open");

  });


document.getElementById("checkoutBtn")
  .addEventListener(
    "click",
    checkoutWhatsApp
  );


// ===============================
// START
// ===============================

saveCart();

renderCart();

loadProducts();
