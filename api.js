// Thay thế đoạn chuỗi mã hash của bạn vào đây sau khi tạo MockAPI
const BASE_URL = "https://6a4d09cbe1cf82a4a17dfd0a.mockapi.io"; 

const API = {
    // Lấy danh sách quán ăn
    getRestaurants: async function() {
        const res = await fetch(`${BASE_URL}/restaurants`);
        if (!res.ok) throw new Error("Không thể tải danh sách quán ăn");
        return await res.json();
    },

    // Thêm quán ăn mới
    createRestaurant: async function(data) {
        const res = await fetch(`${BASE_URL}/restaurants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    // Xóa quán ăn
    deleteRestaurant: async function(id) {
        await fetch(`${BASE_URL}/restaurants/${id}`, { method: 'DELETE' });
    },

    // Lấy danh sách tất cả món ăn
    getItems: async function() {
        const res = await fetch(`${BASE_URL}/items`);
        if (!res.ok) throw new Error("Không thể tải danh sách món ăn");
        return await res.json();
    },

    // Lấy danh sách đơn hàng
    getOrders: async function() {
        const res = await fetch(`${BASE_URL}/orders`);
        if (!res.ok) throw new Error("Không thể lấy danh sách đơn hàng");
        return await res.json();
    },

    // Khách hàng gửi đơn hàng mới lên hệ thống
    createOrder: async function(orderData) {
        const res = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return await res.json();
    },

    // Admin hoặc Tài xế cập nhật trạng thái đơn hàng (Pending -> Shipping -> Completed)
    updateOrderStatus: async function(orderId, status) {
        const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        return await res.json();
    },

    // KỸ THUẬT POLLING FETCH: Tự động chạy cập nhật trạng thái đơn hàng định kỳ
    startPollingOrders: function(callback, intervalMs = 5000) {
        // Thực hiện lấy dữ liệu ngay lập tức lần đầu tiên
        this.getOrders().then(callback).catch(err => console.error("Polling error:", err));
        
        // Thiết lập vòng lặp chạy ngầm lặp lại
        return setInterval(() => {
            this.getOrders().then(callback).catch(err => console.error("Polling error:", err));
        }, intervalMs);
    }
};
