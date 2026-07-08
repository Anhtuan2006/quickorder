/**
 * Quản trị Admin (Cập nhật đơn, Thêm/Xóa quán ăn)
 */
document.addEventListener("DOMContentLoaded", () => {
    loadAdminData();
    document.getElementById("btn-add-res").addEventListener("click", handleAddRestaurant);
});

async function loadAdminData() {
    const restaurants = await API.getRestaurants();
    const orders = await API.getOrders();
    
    renderAdminRestaurants(restaurants);
    renderAdminOrders(orders);
}

function renderAdminRestaurants(list) {
    const container = document.getElementById("admin-res-list");
    if(list.length === 0) {
        container.innerHTML = "<i>Chưa có quán ăn nào.</i>";
        return;
    }
    container.innerHTML = list.map(res => `
        <div class="res-tag">
            ${Utils.escapeHTML(res)}
            <span onclick="handleDeleteRestaurant('${Utils.escapeHTML(res)}')">×</span>
        </div>
    `).join('');
}

function renderAdminOrders(orders) {
    const container = document.getElementById("admin-orders-container");
    if (orders.length === 0) {
        container.innerHTML = "<i>Không tồn tại dữ liệu đơn hàng trên hệ thống.</i>";
        return;
    }

    container.innerHTML = orders.slice().reverse().map(ord => `
        <div class="admin-order" style="border-color: ${ord.status === 'Xong' ? '#55efc4' : '#ccc'}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${ord.id} <small style="color:#888">(${ord.time})</small></strong>
                <span style="font-weight:bold; color:var(--primary)">${Utils.escapeHTML(ord.status)}</span>
            </div>
            <div style="margin: 8px 0; font-size:14px; line-height: 1.4;">
                Quán: <b>${Utils.escapeHTML(ord.restaurant)}</b> | Chi tiết: <i>${Utils.escapeHTML(ord.item)}</i><br>
                📍 Nơi nhận: <b>${Utils.escapeHTML(ord.location)}</b>
            </div>
            <div class="admin-actions">
                <button onclick="changeStatus('${ord.id}', 'Mới')" style="background:#ffeaa7">Mới</button>
                <button onclick="changeStatus('${ord.id}', 'Đang giao')" style="background:#74b9ff; color:white">Đang giao</button>
                <button onclick="changeStatus('${ord.id}', 'Xong')" style="background:#55efc4">Xong</button>
                <button onclick="removeOrder('${ord.id}')" class="btn-del">Xoá đơn</button>
            </div>
        </div>
    `).join('');
}

async function handleAddRestaurant() {
    const inputElement = document.getElementById("new-res-name");
    const name = inputElement.value.trim();

    if(!Utils.validateString(name, 2)) {
        alert("⚠️ Tên quán ăn phải dài ít nhất từ 2 ký tự trở lên!");
        return;
    }

    await API.addRestaurant(name);
    inputElement.value = "";
    loadAdminData();
}

async function handleDeleteRestaurant(name) {
    if(confirm(`Bạn chắc chắn muốn xóa quán "${name}" và toàn bộ thực đơn kèm theo không?`)) {
        await API.deleteRestaurant(name);
        loadAdminData();
    }
}

async function changeStatus(id, newStatus) {
    await API.updateOrderStatus(id, newStatus);
    loadAdminData(); // Cập nhật hiển thị giao diện tức thì
}

async function removeOrder(id) {
    if(confirm("Xoá vĩnh viễn đơn hàng này ra khỏi cơ sở dữ liệu?")) {
        await API.deleteOrder(id);
        loadAdminData();
    }
}
