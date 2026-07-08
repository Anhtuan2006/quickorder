/**
 * Tiện ích hỗ trợ Định dạng và Kiểm tra dữ liệu (Validation)
 */
const Utils = {
    // Định dạng tiền tệ VND (Ví dụ: 30000 -> "30.000 đ")
    formatVND: (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    },

    // Kiểm tra tính hợp lệ của chuỗi nhập vào dữ liệu form
    validateString: (str, minLength = 1) => {
        if (!str || typeof str !== 'string') return false;
        return str.trim().length >= minLength;
    },

    // Xử lý an toàn tránh tấn công XSS khi render chuỗi HTML
    escapeHTML: (str) => {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};
