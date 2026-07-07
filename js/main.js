// Biến lưu trữ trạng thái cục bộ của ứng dụng khách hàng
let globalItems = [];
let globalCart = {}; // Lưu dưới dạng: { itemId: { itemObj, quantity } }
let pollingTimer = null;

$(document).ready(function() {
    // 1. Tải toàn bộ dữ liệu ban đầu từ API
    initPageData();

    // 2. Ràng buộc các sự kiện điều hướng bằng jQuery
    $('#btnBackToRestaurants, #navHomeLink').on('click', function(e) {
        e.preventDefault();
        $('#menuSection').hide();
        $('#restaurantSection').fadeIn(400);
    });

    // 3. Ràng buộc xử lý nộp form đặt hàng (JS thuần + jQuery trộn hợp lệ)
    const form = document.getElementById('checkoutForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCheckoutSubmit(form);
    });
});

// Khởi tạo lấy dữ liệu từ Server MockAPI
async function initPageData() {
    try {
        $('#loadingOverlay').show();
        
        // Gọi đồng thời danh sách quán ăn và món ăn
        const [restaurants, items] = await Promise.all([
            API.getRestaurants(),
            API.getItems()
        ]);
        
        globalItems = items;
        renderRestaurants(restaurants);
        
        // KÍCH HOẠT POLLING FETCH CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG 5 GIÂY / LẦN
        pollingTimer = API.startPollingOrders(renderLiveOrderTable, 5000);
        $('#pollingBadge').removeClass('bg-secondary').addClass('bg-success').text('Đang đồng bộ Real-time');

    } catch (error) {
        Utils.showToast(error.message, 'error');
        $('#pollingBadge').removeClass('bg-secondary').addClass('bg-danger').text('Mất kết nối dữ liệu');
    } finally {
        $('#loadingOverlay').fadeOut(300);
    }
}

// Render danh sách quán ăn ra DOM (JS Thuần)
function renderRestaurants(restaurants) {
    const listContainer = document.getElementById('restaurantList');
    listContainer.innerHTML = '';

    if (restaurants.length === 0) {
        listContainer.innerHTML = `<div class="col-10 text-center py-4 text-muted">Hiện chưa có quán ăn nào mở cửa.</div>`;
        return;
    }

    restaurants.forEach(rest => {
        const cardHTML = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100 custom-card card-clickable" style="cursor: pointer;" onclick="openRestaurantMenu('${rest.id}', '${rest.name}')">
                    <div class="card-img-container">
                        <img src="${rest.image || 'https://placehold.co/400x300?text=No+Image'}" alt="${rest.name}">
                    </div>
                    <div class="card-body p-2.5 text-center">
                        <h5 class="card-title text-truncate fw-bold mb-1 fs-6">${rest.name}</h5>
                        <p class="card-text text-muted small mb-0"><i class="bi bi-geo-alt-fill text-danger"></i> ${rest.location}</p>
                    </div>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Chuyển view xem thực đơn chi tiết của quán ăn sử dụng hiệu ứng jQuery
function openRestaurantMenu(restaurantId, restaurantName) {
    $('#selectedRestaurantName').text(restaurantName);
    const menuContainer = document.getElementById('menuList');
    menuContainer.innerHTML = '';

    // Lọc ra các món ăn thuộc quán ăn này
    const filteredItems = globalItems.filter(item => String(item.restaurantId) === String(restaurantId));

    if (filteredItems.length === 0) {
        menuContainer.innerHTML = `<div class="col-12 text-center py-4 text-muted">Quán ăn chưa đăng tải món ăn nào lên thực đơn.</div>`;
    } else {
        filteredItems.forEach(item => {
            const itemHTML = `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card custom-card h-100 flex-row align-items-center p-2">
                        <img src="${item.image || 'https://placehold.co/100x100?text=Food'}" class="rounded-3" style="width: 80px; height: 80px; object-fit: cover;">
                        <div class="card-body py-1 px-3 d-flex flex-column justify-content-between h-100" style="min-width: 0;">
                            <div>
                                <h6 class="fw-bold mb-1 text-truncate text-dark">${item.name}</h6>
                                <p class="text-danger fw-bold small mb-2">${Utils.formatVND(item.price)}</p>
                            </div>
                            <button class="btn btn-sm btn-primary-custom align-self-start px-3 py-1 rounded-pill small" onclick="addToCart('${item.id}')">
                                <i class="bi bi-plus-circle-fill me-1"></i> Thêm món
                            </button>
                        </div>
                    </div>
                </div>
            `;
            menuContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    // Ẩn khối quán ăn và fadeIn khối thực đơn mượt mà bằng jQuery
    $('#restaurantSection').hide();
    $('#menuSection').fadeIn(400);
}

// Thêm món ăn vào giỏ hàng
window.addToCart = function(itemId) {
    const item = globalItems.find(i => String(i.id) === String(itemId));
    if (!item) return;

    if (globalCart[itemId]) {
        globalCart[itemId].quantity += 1;
    } else {
        globalCart[itemId] = { itemObj: item, quantity: 1 };
    }

    updateCartUI();
    Utils.showToast(`Đã thêm ${item.name} vào giỏ!`, 'success');
};

// Cập nhật giao diện Giỏ hàng & trạng thái hiển thị Nút nổi
function updateCartUI() {
    const cartCountEl = document.getElementById('cartCount');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    
    let totalItems = 0;
    let totalPrice = 0;
    cartItemsList.innerHTML = '';

    Object.keys(globalCart).forEach(id => {
        const cartItem = globalCart[id];
        totalItems += cartItem.quantity;
        totalPrice += cartItem.itemObj.price * cartItem.quantity;

        const row = `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                <div style="max-width: 65%;">
                    <div class="fw-bold text-dark text-truncate small">${cartItem.itemObj.name}</div>
                    <span class="text-muted small">${Utils.formatVND(cartItem.itemObj.price)} x ${cartItem.quantity}</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-xs btn-outline-secondary px-2 py-0" onclick="changeQty('${id}', -1)">-</button>
                    <span class="px-2 fw-bold">${cartItem.quantity}</span>
                    <button class="btn btn-xs btn-outline-secondary px-2 py-0" onclick="changeQty('${id}', 1)">+</button>
                </div>
            </div>
        `;
        cartItemsList.insertAdjacentHTML('beforeend', row);
    });

    cartCountEl.innerText = totalItems;
    cartTotalPrice.innerText = Utils.formatVND(totalPrice);

    // Dùng hiệu ứng jQuery hiển thị nút giỏ hàng nổi khi có đồ ăn
    if (totalItems > 0) {
        $('#btnFloatingCart').fadeIn(300);
    } else {
        $('#btnFloatingCart').fadeOut(300);
        cartItemsList.innerHTML = '<p class="text-center text-muted py-3">Giỏ hàng trống rỗng.</p>';
    }
}

// Thay đổi số lượng món ăn trong modal giỏ hàng
window.changeQty = function(id, delta) {
    if (!globalCart[id]) return;
    globalCart[id].quantity += delta;
    if (globalCart[id].quantity <= 0) {
        delete globalCart[id];
    }
    updateCartUI();
};

// Xử lý nộp form đặt hàng kèm kiểm tra hợp lệ thủ công (Form Validation inline)
async function handleCheckoutSubmit(form) {
    const nameInput = document.getElementById('custName');
    const phoneInput = document.getElementById('custPhone');
    const addrInput = document.getElementById('custAddress');

    let isValid = true;

    // Reset trạng thái báo lỗi cũ
    $('.form-control').removeClass('is-invalid');

    if (!nameInput.value.trim()) {
        $(nameInput).addClass('is-invalid');
        isValid = false;
    }
    if (!Utils.validatePhone(phoneInput.value)) {
        $(phoneInput).addClass('is-invalid');
        isValid = false;
    }
    if (!addrInput.value.trim()) {
        $(addrInput).addClass('is-invalid');
        isValid = false;
    }
    if (Object.keys(globalCart).length === 0) {
        Utils.showToast("Giỏ hàng trống không thể đặt đơn!", "danger");
        return;
    }

    if (!isValid) return; // Dừng lại nếu form lỗi dữ liệu

    // Tổng hợp gói dữ liệu gửi đi
    const cartArray = Object.keys(globalCart).map(id => ({
        name: globalCart[id].itemObj.name,
        quantity: globalCart[id].quantity,
        price: globalCart[id].itemObj.price
    }));

    const totalPrice = cartArray.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const newOrder = {
        customerName: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        address: addrInput.value.trim(),
        cartItems: cartArray,
        totalPrice: totalPrice,
        status: "Pending" // Mới khởi tạo
    };

    try {
        $('#loadingOverlay').show();
        await API.createOrder(newOrder);
        
        // Thành công: Reset biểu mẫu, giỏ hàng và ẩn modal bằng bootstrap api
        form.reset();
        globalCart = {};
        updateCartUI();
        bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
        
        Utils.showToast("Đặt đơn hàng thành công! Đang chờ điều phối.", "success");
        
        // Kích hoạt load lại bảng để thấy đơn mới ngay lập tức
        const updatedOrders = await API.getOrders();
        renderLiveOrderTable(updatedOrders);
    } catch (err) {
        Utils.showToast(err.message, "danger");
    } finally {
        $('#loadingOverlay').fadeOut(300);
    }
}

// Hàm đổ dữ liệu bảng theo dõi đơn hàng bằng Polling (Khách xem / Tài xế nhận đơn)
function renderLiveOrderTable(orders) {
    const tableBody = document.getElementById('liveOrderTableBody');
    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Hiện chưa có đơn đặt hàng nào trong hệ thống.</td></tr>`;
        return;
    }

    // Sắp xếp đơn hàng mới nhất lên trên đầu
    orders.sort((a, b) => b.id - a.id);

    orders.forEach(order => {
        // Tạo chuỗi danh sách món ăn đẹp mắt
        let itemsSummary = order.cartItems.map(i => `<span class="badge bg-light text-dark border">${i.name} x${i.quantity}</span>`).join(' ');

        // Định dạng thẻ Badge trạng thái
        let statusBadge = '';
        let driverActionBtn = '';

        if (order.status === 'Pending') {
            statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split"></i> Chờ xử lý</span>`;
            driverActionBtn = `<button class="btn btn-xs btn-outline-success py-1 px-2 text-nowrap" style="font-size:0.75rem" onclick="driverTakeOrder('${order.id}')"><i class="bi bi-bicycle"></i> Nhận Giao Đơn</button>`;
        } else if (order.status === 'Shipping') {
            statusBadge = `<span class="badge bg-info text-white status-pulse"><i class="bi bi-truck"></i> Đang giao nội khu</span>`;
            driverActionBtn = `<span class="text-muted small italic">Đang được giao...</span>`;
        } else if (order.status === 'Completed') {
            statusBadge = `<span class="badge bg-success"><i class="bi bi-check2-all"></i> Hoàn thành</span>`;
            driverActionBtn = `<i class="bi bi-patch-check-fill text-success fs-5"></i>`;
        }

        const tr = `
            <tr>
                <td class="fw-bold text-secondary">#${order.id}</td>
                <td>
                    <div class="fw-bold">${order.customerName}</div>
                    <div class="small text-muted" style="font-size: 0.8rem;">${order.phone}</div>
                </td>
                <td class="small fw-medium">${order.address}</td>
                <td><div class="d-flex flex-wrap gap-1" style="max-width:250px;">${itemsSummary}</div></td>
                <td class="fw-bold text-danger text-nowrap">${Utils.formatVND(order.totalPrice)}</td>
                <td>${statusBadge}</td>
                <td>${driverActionBtn}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', tr);
    });
}

// Hành động giả định Tài xế bấm Nhận giao hàng ngay tại trang chủ
window.driverTakeOrder = async function(id) {
    try {
        $('#loadingOverlay').show();
        await API.updateOrderStatus(id, 'Shipping');
        Utils.showToast("Bạn đã nhận đơn hàng thành công! Vui lòng tới quán lấy đồ.", "success");
        const updated = await API.getOrders();
        renderLiveOrderTable(updated);
    } catch (err) {
        Utils.showToast(err.message, 'danger');
    } finally {
        $('#loadingOverlay').fadeOut(300);
    }
};
