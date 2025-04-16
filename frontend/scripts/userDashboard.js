document.addEventListener("DOMContentLoaded", async function () {
  const upcomingTable = document.getElementById("upcomingBookings");
  const historyTable = document.getElementById("bookingHistory");

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const BASE_URL = window.ENV.BASE_URL; // Import BASE_URL from env.js

  console.log("Stored Role:", role);
  console.log("Stored Token:", token ? "Exists" : "Not Found");

  if (!token || !userId || role.trim().toLowerCase() !== "user") {
    alert("Unauthorized access! Redirecting to login.");
    logout();
    return;
  }

  // Helper: parse "DD/MM/YYYY" -> Date object
  function parseDDMMYYYY(str) {
    const [dd, mm, yyyy] = str.split("/");
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  // Separate bookings into upcoming vs. history based on today's date
  function separateBookings(bookings) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = [];
    const history = [];

    bookings.forEach((booking) => {
      const bookingDate = parseDDMMYYYY(booking.date);
      if (bookingDate < today) {
        history.push(booking);
      } else {
        upcoming.push(booking);
      }
    });

    return { upcoming, history };
  }

  // Fetch bookings for this user
  async function fetchBookings() {
    try {
      console.log("Fetching bookings for User ID:", userId);
      const response = await fetch(
        `${BASE_URL}/api/booking/userBookings?userId=${userId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          alert("Session expired! Please log in again.");
          logout();
          return;
        }
        throw new Error("Failed to fetch bookings");
      }

      // API returns { upcoming, history } - merge them, then re-separate by date
      let { upcoming, history } = await response.json();
      console.log("✅ Fetched Bookings:", { upcoming, history });

      const allBookings = [...upcoming, ...history];
      const separated = separateBookings(allBookings);
      upcoming = separated.upcoming;
      history = separated.history;

      // Fetch room names for each booking
      upcoming = await fetchRoomNames(upcoming);
      history = await fetchRoomNames(history);

      // Render on the dashboard
      renderBookings(upcoming, "upcomingBookings", true);
      renderBookings(history, "bookingHistory", false);

      // Attach click handlers for "Cancel" buttons
      attachCancelEvents();
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      alert("Failed to load bookings. Please try again.");
    }
  }

  // Fetch room data to map room IDs -> room names
  async function fetchRoomNames(bookings) {
    const roomIds = [...new Set(bookings.map((b) => b.room))];
    const roomNames = {};

    try {
      const response = await fetch(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const rooms = await response.json();

      rooms.forEach((room) => {
        roomNames[room._id] = room.name;
      });
    } catch (error) {
      console.error("❌ Error fetching room names:", error);
    }

    // Attach 'roomName' to each booking
    return bookings.map((booking) => ({
      ...booking,
      roomName: roomNames[booking.room] || "Unknown",
    }));
  }

  // Render bookings into their respective tables
  function renderBookings(bookings, tableId, isUpcoming) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = "";

    // If upcoming => 6 columns (#, Room, Date, Time, Status, Actions)
    // If history => 4 columns (#, Room, Date, Time)
    const colSpan = isUpcoming ? 6 : 4;

    if (bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center">No bookings found.</td></tr>`;
      return;
    }

    bookings.forEach((booking, index) => {
      const row = document.createElement("tr");

      if (isUpcoming) {
        // Only show "Cancel" if booking.status is Pending/Booked
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${booking.roomName || "Unknown"}</td>
          <td>${booking.date}</td>
          <td>${booking.timeSlot}</td>
          <td>
            <span class="badge bg-${getStatusColor(booking.status)}">
              ${booking.status}
            </span>
          </td>
          <td>
            ${
              (booking.status === "Pending" || booking.status === "Booked")
                ? `<button 
                     class="btn btn-danger btn-sm cancel-btn"
                     data-booking-id="${booking._id}"
                     data-room-name="${booking.roomName}"
                     data-booking-date="${booking.date}"
                     data-time-slot="${booking.timeSlot}"
                   >
                     Cancel
                   </button>`
                : ""
            }
          </td>
        `;
      } else {
        // History: #, Room, Date, Time
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${booking.roomName || "Unknown"}</td>
          <td>${booking.date}</td>
          <td>${booking.timeSlot}</td>
        `;
      }

      tableBody.appendChild(row);
    });
  }

  // Attach click handlers to all "Cancel" buttons (no inline 'onclick')
  function attachCancelEvents() {
    const cancelButtons = document.querySelectorAll(".cancel-btn");
    cancelButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookingId = this.dataset.bookingId;
        const roomName = this.dataset.roomName;
        const bookingDate = this.dataset.bookingDate;
        const timeSlot = this.dataset.timeSlot;
        cancelBooking(bookingId, roomName, bookingDate, timeSlot);
      });
    });
  }

  // Return a Bootstrap color for the booking status
  function getStatusColor(status) {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "booked":
        return "success";
      case "completed":
        return "secondary";
      case "rejected":
        return "danger";
      default:
        return "dark";
    }
  }

  // Cancel a booking
  async function cancelBooking(bookingId, roomName, bookingDate, timeSlot) {
    const confirmationText = `Are you sure you want to cancel your booking for ${roomName} on ${bookingDate} at ${timeSlot}? This action cannot be undone.`;
    if (!confirm(confirmationText)) return;

    try {
      const response = await fetch(`${BASE_URL}/api/booking/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!response.ok) throw new Error("Failed to cancel booking");

      const result = await response.json();
      alert(result.message);
      fetchBookings();
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  }

  function logout() {
    console.warn("Logging out user...");
    localStorage.clear();
    window.location.href = "../../index.html";
  }

  // Initialize the dashboard
  fetchBookings();
});
