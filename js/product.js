const id = 1528;
const productURL = "https://kea-alt-del.dk/t7/api/products/" + id;
const productcontainer = document.querySelector("#productContainer");

function getData() {
  fetch(productURL).then((res) => res.json().then((data) => show(data)));
}

function show(data) {
  productcontainer.innerHTML = `
   <a href="productlist.html" class="arrowBack">
        </a>
        <div class="productGrid">
    <img src="https://kea-alt-del.dk/t7/images/webp/640/${id}.webp" alt="Produktbillede">
     <div class="produktBeskrivelse">
     <h4>${data.brandname}</h4>
    <h3>${data.productdisplayname}</h3>
        <p class="productPrice">${data.price} DKK</p>
    <p>${data.description}</p>

   
      <div class="basket">
                    <p>Add to basket</p>
                </div>
     </div>
    </div>
  `;
}

getData();
