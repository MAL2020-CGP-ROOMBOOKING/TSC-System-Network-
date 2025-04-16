document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        // Fetch BASE_URL from window.ENV
        const BASE_URL = window.ENV.BASE_URL;

        try {
            // Make API request using BASE_URL
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();
            console.log("🔍 Login API Response:", result);

            if (response.ok && result.token && result.userId) {
                localStorage.setItem("token", result.token);
                localStorage.setItem("userId", result.userId);
                localStorage.setItem("role", result.role);

                console.log(" Token and Role Stored in LocalStorage:", result);

                if (result.role === "admin") {
                    alert("Logging in as Admin...");
                    window.location.href = "/pages/admin/dashboard.html";
                } else {
                    alert("Logging in as User...");
                    window.location.href = "/pages/users/dashboard.html";
                }
            } else {
                alert(result.message || "Invalid login credentials.");
            }
        } catch (error) {
            console.error(" Error:", error);
            alert("Server error. Please try again.");
        }
    });
});
