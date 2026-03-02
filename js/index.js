const container = document.querySelector("#categories");
const categoriesURL = "https://kea-alt-del.dk/t7/api/categories";

fetch(categoriesURL)
  .then((res) => {
    if (!res.ok) throw new Error("No categories endpoint");
    return res.json();
  })
  .then((categories) => {
    renderCategories(categories);
  })
  .catch(() => {
    // fallback, hvis endpoint ikke findes:
    renderCategoriesFromProducts();
  });

function renderCategories(categories) {
  // Hvis API returnerer objekter, så map til string
  const names = categories.map((c) => (typeof c === "string" ? c : c.category)).filter(Boolean);

  container.innerHTML = "";
  names.forEach((name) => {
    container.innerHTML += categoryLinkHTML(name);
  });
}

// Fallback: hent produkter og udled kategorier
function renderCategoriesFromProducts() {
  fetch("https://kea-alt-del.dk/t7/api/products")
    .then((res) => res.json())
    .then((products) => {
      const uniqueCategories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

      container.innerHTML = "";
      uniqueCategories.forEach((name) => {
        container.innerHTML += categoryLinkHTML(name);
      });
    });
}

function categoryLinkHTML(name) {
  const url = `productlist.html?category=${encodeURIComponent(name)}`;

  return `
    <a href="${url}" class="produktliste">
      ${name} <span class="arrow"></span>
    </a>
  `;
}
