//Declaración de variables globales
const productsContainer = document.querySelector(".productos-container");
const cartContainer = document.querySelector("#cart-container");
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
const btnCart = document.getElementById("btnCart");
const btnUp = document.getElementById("btnUp");
const paymentModal = new bootstrap.Modal(document.getElementById("paymentModal"));
const IMAGE_BASE_PATH = "img/products/";
let apiFailed = false;

//Verificar si hay productos en el carrito
if (cart.length > 0) {
    btnCart.hidden = false;
}  

//Función para obtener los productos
fetch("https://fakestoreapi.in/api/products/category?type=mobile")
    .then((response) => response.json())
    .then((resp) => {
        products= resp.products.filter((product) => product.brand === "apple").sort((a, b) => a.price - b.price);
        renderProducts(products,apiFailed);

    })
    .catch((error) => {
        console.error("Error al obtener los productos:", error);
        fetch("/iphone-store/data/products.json")
            .then((response) => response.json())
            .then((localProducts) => {
                apiFailed = true;
                products = localProducts.sort((a, b) => a.price - b.price);
                renderProducts(products,apiFailed);
                console.log("Productos cargados desde JSON local");
            })
            .catch((localError) => {
                console.error("Error al cargar productos locales:", localError);
                productsContainer.innerHTML = '<p class="text-center text-danger">Error al cargar los productos</p>';
            });
    });

function renderProducts(products, apiFailed) {
        products.forEach((product) => {
        const card = `
            <div class="card">
                <div class="card-image">
                    <img ${apiFailed ? 
                        `src="${IMAGE_BASE_PATH}${product.image}" alt="${product.title}"` : 
                        `src="${product.image}" alt="${product.title}"`} />
                </div>
                <div class="card-title">
                    <h3>${product.title}</h3>
                </div>
                <div class="card-description">
                    <button class="btn-description" onclick="showDescription(this)" data-id=${product.id}>Ver descripción</button>
                </div>
                <div class="card-price">                    
                <p>Precio: $${product.price}</p>
                </div>
                <button class="btn-add-cart" onclick="addToCart(this.parentElement)" data-id="${product.id}">Añadir al carrito</button>
            </div>
        `;
        productsContainer.innerHTML += card;
    });
}
   
/**
 * Agrega un producto al carrito de compras.
 * Si el producto ya existe en el carrito, incrementa su cantidad en 1.
 * De lo contrario, agrega el producto al carrito con una cantidad de 1.
 * Actualiza el contador de productos en el carrito y muestra un mensaje de éxito.
 * @param {Element} card - Contenedor del producto a agregar.
 */
function addToCart(card) {       
        const product = {
            id: card.querySelector("button").dataset.id,
            title: card.querySelector("h3").innerText,
            price: parseFloat(card.querySelector("p").innerText.replace('Precio: $', '')),
            quantity: 1
        };

        const existingProductIndex = cart.findIndex((item) => item.id == product.id);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += 1;
        } else {
            cart.push(product);
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        btnCart.hidden = false;
        updateCartCount();

        Swal.fire({
            icon: "success",
            title: "Producto agregado al carrito",
            showConfirmButton: false,
            timer: 1500,
        });
};

/**
 * Actualiza el contador de productos en el carrito en el botón "Ir al carrito" y
 * en el encabezado de la página.
 */
function updateCartCount() {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalQuantity = 0;

    cart.forEach((item) => {
        totalQuantity += item.quantity;
    });
    document.getElementById("cart-count").innerText = totalQuantity;
    document.getElementById("cart-count-header").innerText = totalQuantity;
}

document.addEventListener("DOMContentLoaded", updateCartCount);

/**
 * Muestra la descripción de un producto en un modal.
 * @param {Element} btn - Botón que contiene el ID del producto.
 */
function showDescription(btn) {
        const id = btn.dataset.id;
        const encontrado = products.find((product) => product.id == id); 

        if (encontrado) {
            document.getElementById("productModalLabel").innerText = `Descripción de ${encontrado.title}`;
            document.getElementById("productDescription").innerText = encontrado.shortDescription;

            const productModal = new bootstrap.Modal(document.getElementById("productModal"));
            productModal.show();
        } else {
           Swal.fire({
                icon: "error",
                title: "Error al cargar la descripción",
                showConfirmButton: false,
                timer: 1500,
            });
        }
};

/**
 * Muestra el carrito de compras y configura su contenido.
 * El contenido se basa en los productos en el carrito y muestra el título, precio, cantidad y total de cada producto.
 * Utiliza la función showCart para configurar el contenido del carrito.
 */
function showCartModal() {
    const cartModal = new bootstrap.Modal(document.getElementById("cartModal"));
    cartModal.show(); 
    showCart(); 
    paymentModal.hide();
}


/**
 * Muestra el carrito de compras y configura su contenido.
 * El contenido se basa en los productos en el carrito y muestra el título, precio, cantidad y total de cada producto.
 * El botón "+" permite aumentar la cantidad de un producto en el carrito y el botón "-" disminuirla.
 * El total del carrito se muestra al final del modal.
 */
function showCart() {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartCount();
    document.getElementById("cartModalLabel").innerText = "Carrito de compras";
    cartContainer.innerHTML = "";

    let total = 0; 
    cart.forEach((item, index) => {
        let cartDetail = `
            <tr>
                <td>${item.title}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                     <div class="d-flex justify-content-center align-items-center gap-2">
                        <button class="btn-update-quantity btn btn-sm btn-success" onclick="sumQuantity(${index})">+</button>
                        <span>${item.quantity}</span>
                        <button class="btn-update-quantity btn btn-sm btn-danger" onclick="restQuantity(${index})">-</button>
                    </div>
                </td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
        cartContainer.innerHTML += cartDetail;
        total += item.price * item.quantity;
    });
    const totalPrice = `
        <tr>
            <td colspan="3" class="text-end fw-bold">Total:</td>
            <td>$${total.toFixed(2)}</td>
        </tr>`;
    cartContainer.innerHTML += totalPrice;
}

/**
 * Aumenta la cantidad de un producto en el carrito en 1 unidad y vuelve a mostrar el carrito.
 * @param {number} index - Índice del producto en el carrito.
 */
function sumQuantity(index) {
    cart[index].quantity += 1; 
    localStorage.setItem("cart", JSON.stringify(cart));
    showCart(); 
}

/**
 * Disminuye la cantidad de un producto en el carrito en 1 unidad y vuelve a mostrar el carrito.
 * Si la cantidad del producto es 0, no hace nada.
 * @param {number} index - Índice del producto en el carrito.
 */
function restQuantity(index) {
    if (cart[index].quantity > 0) { 
        cart[index].quantity -= 1;
    } else {
        return;
    }
    localStorage.setItem("cart", JSON.stringify(cart)); 
    showCart(); 
}

/**
 * Limpia el carrito de compras eliminando todos los productos del carrito.
 * Establece el botón "Ir al carrito" y el enlace "Carrito" en el menú superior en hidden.
 * Actualiza el conteo de productos en el carrito en el botón "Ir al carrito" y en el encabezado de la página.
 */
function clearCart(){
    localStorage.removeItem("cart");
    cart = [];
    btnCart.hidden = true;
    navcart.hidden = true;
    updateCartCount();
    Swal.fire({
        icon: "success",
        title: "Carrito vaciado",
        showConfirmButton: false,
        timer: 1500,
    })
}

/**
 * Abre el modal de pago y muestra un resumen de la compra.
 * El resumen muestra el título, cantidad y subtotal de cada producto en el carrito.
 * El total de la compra se muestra al final del modal.
 * Se utiliza la función filter para mostrar solo los productos con cantidad mayor a 0.
 */
function openCheckoutModal() {
    const cartModal = bootstrap.Modal.getInstance(document.getElementById("cartModal"));
    cartModal.hide();

    const purchaseSummary = document.getElementById("purchase-summary");
    let summaryHTML = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
    `;
    cart.filter(item => item.quantity > 0).forEach(item => {
        summaryHTML += `
            <tr>
                <td>${item.title}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    });

    summaryHTML += `
            </tbody>
        </table>
        <div class="text-end fw-bold">Total: $${cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</div>
    `;

    purchaseSummary.innerHTML = summaryHTML;

    paymentModal.show();
};

/**
 * Finaliza la compra y muestra un alert limpiando el carrito.
 */
function finalizePurchase() {
    alert("Gracias por su compra");

    clearCart();
}



// Configurar la visibilidad de los botones
window.addEventListener("scroll", () => {
    const isAtTop = window.scrollY === 0;
    const isAtDown = window.scrollY > 0;
    const isCartEmpty = cart.length === 0;

    btnUp.hidden = isAtTop;
    btnCart.hidden = isAtTop || isCartEmpty;
    navcart.hidden = isAtDown || isCartEmpty;
});


btnUp.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

/**
 * Valida los campos del formulario de contacto.
 * Muestra un mensaje de error con sweetalert2 si hay campos vacíos.
 * @returns {boolean} false si hay campos vacíos, true en caso contrario.
 */
function validateForm() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
        Swal.fire({
            icon: "error",
            title: "Todos los campos son obligatorios",
            showConfirmButton: false,
            timer: 1500,
        })
        return false;     
    }
    return true;
}
