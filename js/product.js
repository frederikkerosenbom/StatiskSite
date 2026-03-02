const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const productcontainer = document.querySelector("#productContainer");

function calcDiscountPrice(price, discount) {
  return Math.round((price * (100 - discount)) / 100);
}

if (!id) {
  productcontainer.innerHTML = `
    <p>Ingen produkt valgt.</p>
    <a href="productlist.html">Gå tilbage til produktlisten</a>
  `;
} else {
  getData();
}

function getData() {
  fetch(`https://kea-alt-del.dk/t7/api/products/${id}`)
    .then((res) => res.json())
    .then((data) => show(data));
}
function show(data) {
  const isDiscount = data.discount !== null;
  const isSoldout = data.soldout === 1;
  const newPrice = isDiscount ? calcDiscountPrice(data.price, data.discount) : null;

  const priceHTML = isDiscount
    ? `
      <div class="priceBox">
        <div class="priceTop">
          <p class="oldPrice">${data.price} DKK</p>
          <p class="discountText">-${data.discount}%</p>
        </div>
        <p class="newPrice">${newPrice} DKK</p>
      </div>
    `
    : `
      <div class="priceBox">
        <p class="productPrice">${data.price} DKK</p>
      </div>
    `;

  productcontainer.innerHTML = `
    <a href="productlist.html" class="arrowBack"></a>

    <div class="productGrid ${isDiscount ? "discount" : ""}">
      
      <div class="imageWrapper">
        <img src="https://kea-alt-del.dk/t7/images/webp/640/${data.id}.webp" alt="Produktbillede">
        ${isDiscount ? `<span class="dealBadge">-${data.discount}%</span>` : ""}
      </div>

      <div class="produktBeskrivelse">
        <h4>${data.brandname}</h4>
        <h3>${data.productdisplayname}</h3>

        ${priceHTML}

        <p>${data.description ?? ""}</p>

        <div class="stockStatus">
          ${isSoldout ? `<p>Sold out</p>` : ""}
        </div>

        ${
          isSoldout
            ? ""
            : `
      <button type="button" id="addToCartBtn" class="basket">Add to basket</button>
        `
        }
      </div>
    </div>
  `;
  const btn = document.querySelector("#addToCartBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.addToCart(data.id, 1);
      window.openCart();
    });
  }
}
