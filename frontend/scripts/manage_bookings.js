document.addEventListener("DOMContentLoaded", function () {
  const bookingsTable = document.getElementById("bookingsTable");
  const statusFilter = document.getElementById("statusFilter");
  const monthFilter = document.getElementById("filterMonth");
  const yearFilter = document.getElementById("filterYear");
  const downloadReportBtn = document.getElementById("downloadReportBtn");
  const token = localStorage.getItem("token");
  const BASE_URL = window.ENV.BASE_URL;
  if (!token) {
    alert("Unauthorized access! Please log in.");
    window.location.href = "../../index.html";
    return;
  }

  // Helper: Convert "DD/MM/YYYY" and "HH:mm AM/PM" to a Date object
  function parseDateTime(dateStr, timeStr) {
    const [dd, mm, yyyy] = dateStr.split("/");
    const dateObj = new Date(yyyy, mm - 1, dd);
    const [timePart, period] = timeStr.split(" ");
    let [hour, minute] = timePart.split(":").map(Number);
    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
    dateObj.setHours(hour, minute, 0, 0);
    return dateObj;
  }

  // Helper: Get weekday name from a "DD/MM/YYYY" date string.
  function getDayName(dateStr) {
    const [d, m, y] = dateStr.split("/");
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleString("en-US", { weekday: "long" });
  }

  // 1. Fetch all bookings for admin from /api/admin/bookings
  async function fetchBookings() {
    try {
      console.log("Fetching bookings with token:", token);
      const response = await fetch(`${BASE_URL}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server returned error:", errorData);
        throw new Error("Failed to fetch bookings");
      }
      const bookings = await response.json();
      console.log("Bookings data:", bookings);
      renderBookings(bookings);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      alert("Failed to load bookings. Please try again.");
    }
  }

  // 2. Render bookings in the table with extra "Day" column and a Details button
  function renderBookings(bookings) {
    // Sort bookings by date and time descending (latest first)
    bookings.sort((a, b) => {
      const aDateTime = parseDateTime(a.date, a.timeSlot);
      const bDateTime = parseDateTime(b.date, b.timeSlot);
      return bDateTime - aDateTime;
    });

    bookingsTable.innerHTML = "";

    // Set header with columns: #, User, Room, Day, Date, Time, Status, Actions
    bookingsTable.innerHTML += `
      <tr>
        <th>#</th>
        <th>User</th>
        <th>Room</th>
        <th>Day</th>
        <th>Date</th>
        <th>Time</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    `;

    // If no bookings, show a placeholder row
    if (!bookings.length) {
      bookingsTable.innerHTML += `
        <tr>
          <td colspan="8" class="text-center">No bookings found.</td>
        </tr>
      `;
      return;
    }

    bookings.forEach((booking, index) => {
      const userName = booking.user?.name || "Unknown";
      const roomName = booking.room?.name || "Unknown";
      const dayName = booking.date ? getDayName(booking.date) : "Unknown";

      // Create a table row
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${userName}</td>
        <td>${roomName}</td>
        <td>${dayName}</td>
        <td>${booking.date}</td>
        <td>${booking.timeSlot}</td>
        <td>
          <span class="status-badge status-${(booking.status || "").toLowerCase()}">
            ${booking.status}
          </span>
        </td>
        <td></td>
      `;

      // Create action buttons and append them to the last cell
      const actionCell = row.querySelector("td:last-child");
      const buttonElements = createActionButtons(booking);
      buttonElements.forEach((btn) => actionCell.appendChild(btn));

      bookingsTable.appendChild(row);
    });

    // Apply filters after rendering
    applyFilters();
  }

  // 3. Create DOM-based action buttons with an added "Details" button
  function createActionButtons(booking) {
    const buttons = [];

    // Add a Details button that shows additional participant details
    const detailsBtn = document.createElement("button");
    detailsBtn.className = "btn btn-info btn-sm me-1";
    detailsBtn.textContent = "Details";
    detailsBtn.addEventListener("click", () => showBookingDetails(booking));
    buttons.push(detailsBtn);

    switch (booking.status) {
      case "Pending": {
        const approveBtn = document.createElement("button");
        approveBtn.className = "btn btn-success btn-sm me-1";
        approveBtn.textContent = "Approve";
        approveBtn.addEventListener("click", () => {
          if (!confirm("Approve this booking?")) return;
          approveBooking(booking._id);
        });

        const rejectBtn = document.createElement("button");
        rejectBtn.className = "btn btn-danger btn-sm me-1";
        rejectBtn.textContent = "Reject";
        rejectBtn.addEventListener("click", () => {
          if (!confirm("Reject this booking?")) return;
          rejectBooking(booking._id);
        });

        buttons.push(approveBtn, rejectBtn);
        break;
      }

      case "Booked": {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-secondary btn-sm me-1";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
          if (!confirm("Delete this booking permanently?")) return;
          deleteBooking(booking._id);
        });
        buttons.push(deleteBtn);
        break;
      }

      case "Completed":
      case "Expired": {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-secondary btn-sm me-1";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
          if (!confirm("Delete this booking permanently?")) return;
          deleteBooking(booking._id);
        });
        buttons.push(deleteBtn);
        break;
      }

      default:
        break;
    }

    return buttons;
  }

  // Show booking details including additional participants
  function showBookingDetails(booking) {
    let details = `Booking Details:
User: ${booking.user?.name || "Unknown"}
Room: ${booking.room?.name || "Unknown"}
Date: ${booking.date}
Time: ${booking.timeSlot}
Status: ${booking.status}\n\n`;
    if (booking.additionalUsers && booking.additionalUsers.length > 0) {
      details += "Additional Participants:\n";
      booking.additionalUsers.forEach((participant, idx) => {
        details += `${idx + 1}. Name: ${participant.name}, Phone: ${participant.phone}, Email: ${participant.email}\n`;
      });
    } else {
      details += "No additional participant details available.";
    }
    alert(details);
  }

  // 4. Approve a booking
  async function approveBooking(bookingId) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/approve/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to approve booking");

      alert("Booking Approved!");
      fetchBookings();
    } catch (error) {
      console.error("❌ Error approving booking:", error);
      alert("Failed to approve booking. Please try again.");
    }
  }

  // 5. Reject a booking
  async function rejectBooking(bookingId) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/reject/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to reject booking");

      alert("Booking Rejected!");
      fetchBookings();
    } catch (error) {
      console.error("❌ Error rejecting booking:", error);
      alert("Failed to reject booking. Please try again.");
    }
  }

  // 6. Delete a booking
  async function deleteBooking(bookingId) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete booking");

      alert("Booking Deleted!");
      fetchBookings();
    } catch (error) {
      console.error("❌ Error deleting booking:", error);
      alert("Failed to delete booking. Please try again.");
    }
  }

  // 7. Filtering by Status, Month, Year
  function applyFilters() {
    const statusValue = statusFilter.value.toLowerCase().trim();
    const monthValue = monthFilter.value;
    const yearValue = yearFilter.value;

    document.querySelectorAll("#bookingsTable tr").forEach((row) => {
      // Skip header row (assumed to have th elements)
      if (row.querySelectorAll("th").length) return;

      const statusBadge = row.querySelector(".status-badge");
      const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : "";
      // Date is in column index 4 (0-based index) because header: #, User, Room, Day, Date, Time, Status, Actions
      const dateCell = row.cells[4] ? row.cells[4].textContent.trim() : "";
      let rowShouldShow = true;

      if (statusValue !== "all" && statusText !== statusValue) {
        rowShouldShow = false;
      }
      if (rowShouldShow && dateCell) {
        const [dd, mm, yyyy] = dateCell.split("/");
        if (monthValue && mm !== monthValue) {
          rowShouldShow = false;
        }
        if (yearValue && yyyy !== yearValue) {
          rowShouldShow = false;
        }
      }

      row.style.display = rowShouldShow ? "" : "none";
    });
  }

  statusFilter.addEventListener("change", applyFilters);
  monthFilter.addEventListener("change", applyFilters);
  yearFilter.addEventListener("change", applyFilters);

  // 8. CSV Export: Download visible rows as CSV
  function downloadCSV(csv, filename) {
    const csvFile = new Blob([csv], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  function exportTableToCSV(filename) {
    const csv = [];

    // Header row
    const headers = [];
    document.querySelectorAll("table thead th").forEach((th) => {
      headers.push(`"${th.innerText}"`);
    });
    csv.push(headers.join(","));

    // Visible rows
    document.querySelectorAll("#bookingsTable tr").forEach((row) => {
      if (row.style.display !== "none") {
        const cols = Array.from(row.cells).map((cell) =>
          `"${cell.innerText.replace(/"/g, '""')}"`
        );
        csv.push(cols.join(","));
      }
    });

    downloadCSV(csv.join("\n"), filename);
  }

  if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", () => {
      exportTableToCSV("booking_report.csv");
    });
  }

  // Initial load of bookings
  fetchBookings();
});
