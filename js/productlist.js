const listContainer = document.querySelector(".productContainer");

// URL category-filter (fra forsiden)
const params = new URLSearchParams(window.location.search);
const category = params.get("category");
const baseURL = "https://kea-alt-del.dk/t7/api/products";
const limit = 30;
const listURL = category ? `${baseURL}?category=${encodeURIComponent(category)}&limit=${limit}` : `${baseURL}?limit=${limit}`;
const categoryHeader = document.querySelector(".categoryHeader");

if (category) {
  categoryHeader.textContent = category;
} else {
  categoryHeader.textContent = "All products";
}

let allProducts = [];
let filteredProducts = [];

// Pagination
let currentPage = 1;
const pageSize = 12; // antal produkter per side

// UI elements
const sortSelect = document.querySelector("#sortSelect");
const seasonSelect = document.querySelector("#seasonSelect");
const usageSelect = document.querySelector("#usageSelect");
const subcategorySelect = document.querySelector("#subcategorySelect");
const genderSelect = document.querySelector("#genderSelect");
const articleSelect = document.querySelector("#articleSelect");
const discountOnly = document.querySelector("#discountOnly");
const inStockOnly = document.querySelector("#inStockOnly");

const filterDropdown = document.querySelector("#filterDropdown");
const clearFiltersBtn = document.querySelector("#clearFiltersBtn");
const filterLabelText = document.querySelector("#filterLabelText");

const resultCountEl = document.querySelector("#resultCount");
const prevPageBtn = document.querySelector("#prevPageBtn");
const nextPageBtn = document.querySelector("#nextPageBtn");
const pageInfoEl = document.querySelector("#pageInfo");

function calcDiscountPrice(price, discount) {
  return Math.round((price * (100 - discount)) / 100);
}

function effectivePrice(p) {
  return p.discount !== null ? calcDiscountPrice(p.price, p.discount) : p.price;
}

function updateFilterLabel() {
  if (!filterLabelText) return;

  let count = 0;
  if (seasonSelect.value) count++;
  if (usageSelect.value) count++;
  if (subcategorySelect.value) count++;
  if (genderSelect.value) count++;
  if (articleSelect.value) count++;
  if (discountOnly.checked) count++;
  if (inStockOnly.checked) count++;

  filterLabelText.textContent = count === 0 ? "Ingen filtre" : `${count} filter${count > 1 ? "e" : ""} valgt`;
}

function getProducts() {
  fetch(listURL)
    .then((res) => res.json())
    .then((products) => {
      allProducts = products;
      buildFilterOptions(allProducts);
      applyFiltersAndSort();
    });
}

// Byg dropdown-values dynamisk ud fra data
function buildFilterOptions(products) {
  fillSelect(seasonSelect, uniqueValues(products, "season"));
  fillSelect(usageSelect, uniqueValues(products, "usagetype"));
  fillSelect(subcategorySelect, uniqueValues(products, "subcategory"));
  fillSelect(genderSelect, uniqueValues(products, "gender"));
  fillSelect(articleSelect, uniqueValues(products, "articletype"));
}

function uniqueValues(products, key) {
  return [...new Set(products.map((p) => p[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function fillSelect(selectEl, values) {
  selectEl.innerHTML = `<option value="">Alle</option>`;
  values.forEach((val) => {
    selectEl.innerHTML += `<option value="${val}">${val}</option>`;
  });
}

function applyFiltersAndSort() {
  // 1) Start altid fra ALLE produkter
  let result = [...allProducts];

  // 2) Læs values fra UI (dropdowns + checkboxes)
  const selectedSeason = seasonSelect.value;
  const selectedUsage = usageSelect.value;
  const selectedSubcategory = subcategorySelect.value;
  const selectedGender = genderSelect.value;
  const selectedArticle = articleSelect.value;

  const onlyDiscount = discountOnly.checked;
  const onlyInStock = inStockOnly.checked;

  // 3) Filtrér (kun hvis noget er valgt)
  if (selectedSeason) {
    result = result.filter((p) => p.season === selectedSeason);
  }

  if (selectedUsage) {
    result = result.filter((p) => p.usagetype === selectedUsage);
  }

  if (selectedSubcategory) {
    result = result.filter((p) => p.subcategory === selectedSubcategory);
  }

  if (selectedGender) {
    result = result.filter((p) => p.gender === selectedGender);
  }

  if (selectedArticle) {
    result = result.filter((p) => p.articletype === selectedArticle);
  }

  if (onlyDiscount) {
    result = result.filter((p) => p.discount !== null);
  }

  if (onlyInStock) {
    result = result.filter((p) => p.soldout === 0);
  }

  // 4) Sortér (kun hvis, der er valgt en sortering)
  const sortType = sortSelect.value;

  if (sortType === "price-asc") {
    result.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  } else if (sortType === "price-desc") {
    result.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  } else if (sortType === "alpha-asc") {
    result.sort((a, b) => a.productdisplayname.localeCompare(b.productdisplayname));
  } else if (sortType === "alpha-desc") {
    result.sort((a, b) => b.productdisplayname.localeCompare(a.productdisplayname));
  }

  // 5) Gem det resultat der skal vises
  filteredProducts = result;

  // 6) Reset til side 1, fordi listen har ændret sig
  currentPage = 1;

  // 7) Opdater UI + render
  updateFilterLabel();
  renderCurrentPage();
}
function renderCurrentPage() {
  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // clamp hvis der fx bliver færre sider efter filter
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  const pageItems = filteredProducts.slice(start, end);

  showProducts(pageItems);
  updateCountAndPagination(total, totalPages, start, end);
}

function updateCountAndPagination(total, totalPages, start, end) {
  const showingFrom = total === 0 ? 0 : start + 1;
  const showingTo = Math.min(end, total);

  resultCountEl.textContent = `Viser ${showingFrom}-${showingTo} af ${total} produkter`;

  pageInfoEl.textContent = `Side ${currentPage} / ${totalPages}`;

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

function showProducts(products) {
  listContainer.innerHTML = "";

  products.forEach((product) => {
    const isDiscount = product.discount !== null;
    const isSoldout = product.soldout === 1;
    const newPrice = isDiscount ? calcDiscountPrice(product.price, product.discount) : null;

    const classes = `productCard ${isDiscount ? "discount" : ""} ${isSoldout ? "soldout" : ""}`;

    const priceHTML = isDiscount
      ? `
        <div class="priceBox">
          <div class="priceTop">
            <p class="oldPrice">${product.price} DKK</p>
            <p class="discountText">-${product.discount}%</p>
          </div>
          <p class="newPrice">${newPrice} DKK</p>
        </div>
      `
      : `
        <div class="priceBox">
          <p class="price">${product.price} DKK</p>
        </div>
      `;

    listContainer.innerHTML += `
      <article class="${classes}">
        <div class="dealBox">
          <h4>${product.brandname}</h4>
          <p class="deal">DEAL</p>
        </div>

        <h3>${product.productdisplayname}</h3>
        <img src="https://kea-alt-del.dk/t7/images/webp/640/${product.id}.webp" alt="Produktbillede">

        ${priceHTML}

        <a href="product.html?id=${product.id}" class="produktLink">See product...</a>

        <button type="button" class="buyBtn" data-id="${product.id}" ${isSoldout ? "disabled" : ""}>
  ${isSoldout ? "Sold out" : "Buy now"}
</button>
        <p class="soldoutText">Sold out</p>
      </article>
    `;
  });
  document.querySelectorAll(".buyBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      window.addToCart(id, 1);
      window.openCart(); // åbner slide-in panel når man tilføjer
    });
  });
}

// Ryd filtre
function clearFilters() {
  sortSelect.value = "";
  seasonSelect.value = "";
  usageSelect.value = "";
  subcategorySelect.value = "";
  genderSelect.value = "";
  articleSelect.value = "";
  discountOnly.checked = false;
  inStockOnly.checked = false;

  applyFiltersAndSort();
}

// Auto-close filter dropdown når man ændrer filters
function closeFiltersDropdown() {
  if (filterDropdown) filterDropdown.open = false;
}

// Events
sortSelect.addEventListener("change", () => {
  applyFiltersAndSort();
  closeFiltersDropdown();
});

[seasonSelect, usageSelect, subcategorySelect, genderSelect, articleSelect, discountOnly, inStockOnly].forEach((el) =>
  el.addEventListener("change", () => {
    applyFiltersAndSort();
    closeFiltersDropdown();
  }),
);

clearFiltersBtn.addEventListener("click", () => {
  clearFilters();
  closeFiltersDropdown();
});

// Pagination buttons
prevPageBtn.addEventListener("click", () => {
  currentPage--;
  renderCurrentPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

nextPageBtn.addEventListener("click", () => {
  currentPage++;
  renderCurrentPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

getProducts();
