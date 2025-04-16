const BASE_URL = window.ENV.BASE_URL;
document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            localStorage.removeItem("token"); // Remove Token
            localStorage.removeItem("role"); // Remove User Role
            localStorage.removeItem("userId"); // Remove User ID
            alert("You have been logged out successfully!");
            window.location.href = "../index.html"; // Redirect to Login Page
        });
    }
});
