/**
 * Trang chính (Khách hàng & Tài xế)
 */
document.addEventListener("DOMContentLoaded", () => {
    initPage();
    setupEventListeners();
});

// Biến lưu trữ polling ID để có thể huỷ khi cần
let trackingPollingId = null;

async function initPage() {
    try {
        const restaurants = await API.getRestaurants();
        const selectElement = document.getElementById("select-restaurant");
        
        selectElement.innerHTML = restaurants.map(res => 
            `<option value="${Utils.escapeHTML(res)}">${Utils.escapeHTML(res)}</option>`
        ).join('');

        // Tải danh sách món ăn của quán đầu tiên được chọn
        if (restaurants.length > 0) {
            loadItems(restaurants[0]);
        }

        // Thực hiện Fetch dữ liệu lần đầu tiên và khởi chạy Polling 3s/lần cập nhật Trạng thái
        const initialOrders = await API.getOrders();
        renderTracking(initialOrders);
        
        trackingPollingId = API.startPolling((updatedOrders) => {
            renderTracking(updatedOrders);
        }, 3000);

    } catch (error) {
        console.error("Lỗi tải cấu hình trang:", error);
    }
}

function setupEventListeners() {
    document.getElementById("select-restaurant").addEventListener("change", (e) => {
        loadItems(e.target.value);
    });

    document.getElementById("btn-submit-order").addEventListener("click", submitOrderForm);
}

async function loadItems(restaurantName) {
    const itemsContainer = document.getElementById("items-container");
    const items = await API.getItemsByRestaurant(restaurantName);

    if (items.length === 0) {
        itemsContainer.innerHTML = "<i>Quán này chưa đăng ký danh mục món ăn.</i>";
        return;
    }

    itemsContainer.innerHTML = items.map((item, index) => `
        <div class="item-card">
            <div>
                <strong>${Utils.escapeHTML(item.name)}</strong><br>
                <span style="color: var(--primary); font-weight:600">${Utils.formatVND(item.price)}</span>
            </div>
            <input type="radio" name="selected-product" value="${Utils.escapeHTML(item.name)} - ${Utils.formatVND(item.price)}" ${index === 0 ? 'checked' : ''} style="width:20px">
        </div>
    `).join('');
}

async function submitOrderForm() {
    const resValue = document.getElementById("select-restaurant").value;
    const locationValue = document.getElementById("order-location").value;
    const selectedRadio = document.querySelector('input[name="selected-product"]:checked');

    if (!Utils.validateString(locationValue, 5)) {
        alert("⚠️ Vui lòng nhập địa chỉ giao hàng cụ thể hơn (tối thiểu 5 ký tự)!");
        return;
    }
    if (!selectedRadio) {
        alert("⚠️ Vui lòng chọn món ăn trước khi đặt đơn!");
        return;
    }

    const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        restaurant: resValue,
        item: selectedRadio.value,
        location: locationValue,
        status: 'Mới',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const response = await API.createOrder(newOrder);
    if (response.success) {
        alert(`🎉 Bạn đã đặt đơn thành công!\nMã đơn: ${response.order.id}`);
        document.getElementById("order-location").value = "";
        // Re-render ngay lập tức không đợi vòng polling kế tiếp
        const currentOrders = await API.getOrders();
        renderTracking(currentOrders);
    }
}

function renderTracking(orders) {
    const container = document.getElementById("tracking-container");
    if (orders.length === 0) {
        container.innerHTML = "<i>Chưa có đơn hàng nào chạy trong hệ thống.</i>";
        return;
    }

    // Hiển thị đơn mới đặt lên vị trí đầu tiên
    container.innerHTML = orders.slice().reverse().map(ord => {
        // Chuyển "Đang giao" thành "Đang_giao" để đồng nhất CSS Class Selector
        const cssStatusClass = ord.status.replace(' ', '_');
        return `
            <div class="order-card">
                <span class="status-badge status-${cssStatusClass}">${Utils.escapeHTML(ord.status)}</span>
                <h3>${ord.id}</h3>
                <p style="margin: 6px 0 3px 0;">🏬 <b>Quán:</b> ${Utils.escapeHTML(ord.restaurant)}</p>
                <p style="margin-bottom: 3px;">🍱 <b>Món ăn:</b> ${Utils.escapeHTML(ord.item)}</p>
                <p style="font-size:13px; color:#555;">📍 <b>Giao tới:</b> ${Utils.escapeHTML(ord.location)}</p>
                <small style="color: #bbb; display:block; margin-top:5px;">Đặt lúc: ${ord.time}</small>
            </div>
        `;
    }).join('');
}
