// Các hàm tiện ích bổ trợ cho hệ thống
const Utils = {
    // Định dạng tiền tệ VND chuyên nghiệp
    formatVND: function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    },

    // Định dạng ngày tháng hiển thị
    formatDate: function(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    },

    // Kiểm tra tính hợp lệ của số điện thoại Việt Nam
    validatePhone: function(phone) {
        const regex = /^(03|05|07|08|09)+([0-9]{8})$/;
        return regex.test(phone.trim());
    },

    // Hiển thị thông báo Toast nhanh góc màn hình
    showToast: function(message, type = 'success') {
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0 position-fixed top-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true" style="z-index: 1090;">
                <div class="d-flex">
                    <div class="toast-body"><i class="bi bi-info-circle-fill me-2"></i>${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
};
