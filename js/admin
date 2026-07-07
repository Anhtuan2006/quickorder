let adminPollingTimer = null;

$(document).ready(function() {
    loadAdminDashboard();

    // Sự kiện thêm quán ăn mới (Sử dụng JS thuần trộn jQuery thông báo lỗi)
    const addRestForm = document.getElementById('addRestaurantForm');
    addRestForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('restName');
        const locInput = document.getElementById('restLoc');
        const imgInput = document.getElementById('restImg');

        if (!nameInput.value.trim() || !locInput.value.trim()) {
            Utils.showToast("Vui lòng nhập đầy đủ các trường dữ liệu bắt buộc (*)", "danger");
            return;
        }

        const newRestData = {
            name: nameInput.value.trim(),
            location: locInput.value.trim(),
            image: imgInput.value.trim() || "https://placehold.co/400x300?text=Food+Store"
        };

        try {
            $('#loadingOverlay').show();
            await API.createRestaurant(newRestData);
            Utils.showToast("Thêm quán ăn mới thành công!", "success");
            addRestForm.reset();
            
            // Tải lại danh sách quán ăn sau khi thêm
            const updatedRests = await API.getRestaurants();
            renderAdminRestaurants(updatedRests);
        } catch (error) {
            Utils.showToast(error.message, "danger");
        } finally {
            $('#loadingOverlay').fadeOut(300);
        }
    });
});

// Khởi chạy đồng bộ trang quản trị
async function loadAdminDashboard() {
    try {
        $('#loadingOverlay').show();
        const restaurants = await API.getRestaurants();
        renderAdminRestaurants(restaurants);

        // Chạy Polling cập nhật danh sách đơn hàng cho Admin quản trị
        adminPollingTimer = API.startPollingOrders(renderAdminOrderTable, 5000);

    } catch (error) {
        Utils.showToast(error.message, "danger");
    } finally {
        $('#loadingOverlay').fadeOut(300);
    }
}

// Đổ danh sách đơn hàng vào bảng Admin
function renderAdminOrderTable(orders) {
    const tableBody = document.getElementById('adminOrderTableBody');
    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Không có đơn hàng nào cần quản lý.</td></tr>`;
        return;
    }

    orders.sort((a, b) => b.id - a.id);

    orders.forEach(order => {
        let itemsSummary = order.cartItems.map(i => `<span class="badge bg-light text-dark border">${i.name} x${i.quantity}</span>`).join(' ');

        let statusBadge = '';
        let actionBtn = '';

        if (order.status === 'Pending') {
            statusBadge = `<span class="badge bg-warning text-dark">Chờ Tài xế</span>`;
            actionBtn = `<button class="btn btn-xs btn-primary py-1 px-2 text-nowrap fs-7" onclick="changeStatusByAdmin('${order.id}', 'Shipping')">Giao hàng ngay</button>`;
        } else if (order.status === 'Shipping') {
            statusBadge = `<span class="badge bg-info text-white status-pulse">Đang đi giao</span>`;
            actionBtn = `<button class="btn btn-xs btn-success py-1 px-2 text-nowrap fs-7" onclick="changeStatusByAdmin('${order.id}', 'Completed')"><i class="bi bi-check2"></i> Xong</button>`;
        } else if (order.status === 'Completed') {
            statusBadge = `<span class="badge bg-success">Hoàn thành</span>`;
            actionBtn = `<span class="text-success small fw-bold"><i class="bi bi-shield-check"></i> Lưu kho</span>`;
        }

        const rowHTML = `
            <tr>
                <td class="fw-bold text-muted">#${order.id}</td>
                <td>
                    <div class="fw-bold">${order.customerName}</div>
                    <div class="small text-muted">${order.phone}</div>
                </td>
                <td class="small">${order.address}</td>
                <td><div class="d-flex flex-wrap gap-1" style="max-width:220px;">${itemsSummary}</div></td>
                <td class="fw-bold text-danger">${Utils.formatVND(order.totalPrice)}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowHTML);
    });
}

// Thay đổi trạng thái đơn hàng phía Admin quản trị
window.changeStatusByAdmin = async function(id, nextStatus) {
    try {
        $('#loadingOverlay').show();
        await API.updateOrderStatus(id, nextStatus);
        Utils.showToast(`Đã chuyển trạng thái đơn #${id} thành công!`, "success");
        const updated = await API.getOrders();
        renderAdminOrderTable(updated);
    } catch (error) {
        Utils.showToast(error.message, "danger");
    } finally {
        $('#loadingOverlay').fadeOut(300);
    }
};

// Đổ dữ liệu danh sách quản lý quán ăn (CRUD)
function renderAdminRestaurants(restaurants) {
    const tableBody = document.getElementById('adminRestaurantTableBody');
    tableBody.innerHTML = '';

    if (restaurants.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Chưa có dữ liệu quán ăn nào.</td></tr>`;
        return;
    }

    restaurants.forEach(rest => {
        const rowHTML = `
            <tr>
                <td><img src="${rest.image}" class="rounded" style="width:45px; height:45px; object-fit:cover;"></td>
                <td class="fw-bold text-dark small">${rest.name}</td>
                <td class="text-muted small">${rest.location}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger px-2 py-1" onclick="deleteRestaurantByAdmin('${rest.id}')">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowHTML);
    });
}

// Xóa một quán ăn khỏi hệ thống
window.deleteRestaurantByAdmin = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa quán ăn này khỏi hệ thống không?")) return;
    
    try {
        $('#loadingOverlay').show();
        await API.deleteRestaurant(id);
        Utils.showToast("Đã xóa quán ăn thành công!", "success");
        const restaurants = await API.getRestaurants();
        renderAdminRestaurants(restaurants);
    } catch (error) {
        Utils.showToast("Lỗi khi xóa: " + error.message, "danger");
    } finally {
        $('#loadingOverlay').fadeOut(300);
    }
};
