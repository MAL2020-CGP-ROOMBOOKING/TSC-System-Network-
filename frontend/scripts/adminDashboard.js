document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Fetch BASE_URL from the global window.ENV object
  const BASE_URL = window.ENV.BASE_URL; // Use BASE_URL from the window object

  console.log("Stored Role:", role); // Debugging log
  console.log("Stored Token:", token ? "Exists" : "Not Found"); // Debugging log

  // Ensure the user is an admin
  if (!token || !role || role.trim().toLowerCase() !== "admin") {
      alert("Unauthorized access! Redirecting to login.");
      logout();
      return;
  }

  async function fetchDashboardData() {
      try {
          // Make sure the URL uses BASE_URL dynamically
          const response = await fetch(`${BASE_URL}/api/admin/dashboard`, {
              headers: { Authorization: `Bearer ${token}` },
          });

          console.log("API Response Status:", response.status); // Debugging log

          if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                  alert("Session expired or unauthorized. Please log in again.");
                  logout();
                  return;
              }
              throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Dashboard Data:", data); // Debugging log

          // Safely populate dashboard elements (use optional chaining or nullish coalescing)
          document.getElementById("totalRooms").textContent = data.totalRooms ?? 0;
          document.getElementById("pendingBookings").textContent = data.pendingBookings ?? 0;
          document.getElementById("completedBookings").textContent = data.completedBookings ?? 0;
          document.getElementById("totalUsers").textContent = data.totalUsers ?? 0;
      } catch (error) {
          console.error("❌ Error loading dashboard data:", error.message);
          alert("Failed to load dashboard data. Please try again later.");
      }
  }

  // Logout function for clearing session data and redirecting
  function logout() {
      console.warn("Logging out user..."); // Debugging log
      localStorage.clear();
      window.location.href = "../../index.html"; // Redirect to login page or homepage
  }

  fetchDashboardData();
});
