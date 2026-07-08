/**
 * MOCK ENGINE & API LAYER
 * Giả lập API thông qua Promise và LocalStorage để chạy được đầy đủ tính năng fetch tĩnh
 */

// Kho dữ liệu mẫu mặc định khởi tạo ban đầu
const INITIAL_RESTAURANTS = ["Cơm Tấm Sinh Viên", "Trà Sữa KTX", "Bún Chả Toà A"];
const INITIAL_ITEMS = {
    "Cơm Tấm Sinh Viên": [{name: "Cơm sườn trứng", price: 30000}, {name: "Cơm gà phi lê", price: 35000}],
    "Trà Sữa KTX": [{name: "Trà sữa trân châu", price: 25000}, {name: "Hồng trà chanh", price: 20000}],
    "Bún Chả Toà A": [{name: "Bún chả đặc biệt", price: 40000}, {name: "Nem cua bể", price: 15000}]
};

if (!localStorage.getItem('api_restaurants')) localStorage.setItem('api_restaurants', JSON.stringify(INITIAL_RESTAURANTS));
if (!localStorage.getItem('api_items')) localStorage.setItem('api_items', JSON.stringify(INITIAL_ITEMS));
if (!localStorage.getItem('api_orders')) localStorage.setItem('api_orders', JSON.stringify([]));

// Định nghĩa các hàm Fetch API (Mô phỏng Request HTTP qua Promise)
const API = {
    // GET /api/restaurants
    getRestaurants: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(JSON.parse(localStorage.getItem('api_restaurants')));
            }, 100); // Tạo độ trễ mạng giả lập 100ms
        });
    },

    // POST /api/restaurants
    addRestaurant: (name) => {
        return new Promise((resolve) => {
            let res = JSON.parse(localStorage.getItem('api_restaurants'));
            res.push(name);
            localStorage.setItem('api_restaurants', JSON.stringify(res));

            // Cập nhật thực đơn mặc định cho quán mới
            let items = JSON.parse(localStorage.getItem('api_items'));
            items[name] = [{ name: "Món ăn mặc định", price: 20000 }];
            localStorage.setItem('api_items', JSON.stringify(items));

            setTimeout(() => resolve({ success: true, message: "Đã thêm quán" }), 100);
        });
    },

    // DELETE /api/restaurants
    deleteRestaurant: (name) => {
        return new Promise((resolve) => {
            let res = JSON.parse(localStorage.getItem('api_restaurants'));
            res = res.filter(r => r !== name);
            localStorage.setItem('api_restaurants', JSON.stringify(res));
            setTimeout(() => resolve({ success: true }), 100);
        });
    },

    // GET /api/items?restaurant=...
    getItemsByRestaurant: (restaurantName) => {
        return new Promise((resolve) => {
            const allItems = JSON.parse(localStorage.getItem('api_items'));
            setTimeout(() => resolve(allItems[restaurantName] || []), 100);
        });
    },

    // GET /api/orders
    getOrders: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(JSON.parse(localStorage.getItem('api_orders')));
            }, 100);
        });
    },

    // POST /api/orders
    createOrder: (orderData) => {
        return new Promise((resolve) => {
            const orders = JSON.parse(localStorage.getItem('api_orders'));
            orders.push(orderData);
            localStorage.setItem('api_orders', JSON.stringify(orders));
            setTimeout(() => resolve({ success: true, order: orderData }), 150);
        });
    },

    // PUT /api/orders/:id (Cập nhật trạng thái mới/đang giao/xong)
    updateOrderStatus: (orderId, newStatus) => {
        return new Promise((resolve) => {
            let orders = JSON.parse(localStorage.getItem('api_orders'));
            orders = orders.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord);
            localStorage.setItem('api_orders', JSON.stringify(orders));
            setTimeout(() => resolve({ success: true }), 100);
        });
    },

    // DELETE /api/orders/:id
    deleteOrder: (orderId) => {
        return new Promise((resolve) => {
            let orders = JSON.parse(localStorage.getItem('api_orders'));
            orders = orders.filter(ord => ord.id !== orderId);
            localStorage.setItem('api_orders', JSON.stringify(orders));
            setTimeout(() => resolve({ success: true }), 100);
        });
    },

    // POLLING ENGINE: Hàm triển khai Polling gọi nạp lại dữ liệu liên tục
    startPolling: (callback, intervalMs = 3000) => {
        return setInterval(async () => {
            try {
                const data = await API.getOrders();
                callback(data);
            } catch (err) {
                console.error("Lỗi Polling Fetch dữ liệu API:", err);
            }
        }, intervalMs);
    }
};