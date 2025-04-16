document.addEventListener("DOMContentLoaded", function () {
  const roomSelect = document.getElementById("roomSelect");
  const scheduleTable = document.getElementById("scheduleTable");
  const tableHeaders = document.getElementById("tableHeaders");
  const weekRange = document.getElementById("weekRange");
  const confirmBookingBtn = document.getElementById("confirmBookingBtn");
  const prevWeekBtn = document.getElementById("prevWeekBtn");
  const nextWeekBtn = document.getElementById("nextWeekBtn");

  // Modal elements for additional users
  const additionalUsersModalEl = document.getElementById("additionalUsersModal");
  const additionalUsersContainer = document.getElementById("additionalUsersContainer");
  const addParticipantBtn = document.getElementById("addParticipantBtn");
  const removeParticipantBtn = document.getElementById("removeParticipantBtn");
  const confirmAdditionalUsersBtn = document.getElementById("confirmAdditionalUsersBtn");
  const participantCountSpan = document.getElementById("participantCount");
  const BASE_URL = window.ENV.BASE_URL;

  const token = localStorage.getItem("token");
  let currentDate = new Date();
  let selectedSlots = new Set();

  if (!token) {
    alert("Unauthorized access! Please log in.");
    window.location.href = "../../index.html";
    return;
  }

  // Times in 12-hour format, matching your DB's "HH:mm AM/PM"
  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  // Format date as DD/MM/YYYY
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Helper: Convert a DD/MM/YYYY string to a Date object (midnight of that day)
  function parseDDMMYYYY(str) {
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m}-${d}`);
  }

  // Helper: Given a date string ("DD/MM/YYYY") and a time slot ("HH:mm AM/PM"), return a Date object with that time.
  function getSlotDateTime(dateStr, timeSlot) {
    const dateObj = parseDDMMYYYY(dateStr);
    const [time, period] = timeSlot.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj;
  }

  // Fetch the list of rooms, filtering by "Available" status
  async function fetchRooms() {
    try {
      const response = await fetch(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const rooms = await response.json();

      const availableRooms = rooms.filter(room => room.status === "Available");
      roomSelect.innerHTML = `<option value="">Select a Room</option>`;
      availableRooms.forEach(room => {
        const option = document.createElement("option");
        option.value = room._id;
        option.textContent = `${room.name} (${room.type})`;
        roomSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }

  // Get Sunday-to-Saturday range for the current week
  function getWeekRange(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Saturday
    return { start, end };
  }

  // Load schedule for the selected room and date range
  async function loadSchedule() {
    const roomId = roomSelect.value;
    if (!roomId) return;
    const currentUserId = localStorage.getItem("userId");
    const { start, end } = getWeekRange(currentDate);
    weekRange.textContent = `${formatDate(start)} - ${formatDate(end)}`;

    try {
      const response = await fetch(
        `${BASE_URL}/api/booking/schedule?room=${roomId}&start=${formatDate(start)}&end=${formatDate(end)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to load schedule");

      const data = await response.json();
      console.log("Schedule data from server:", data);

      scheduleTable.innerHTML = "";
      tableHeaders.innerHTML = "<th>Time</th>";

      // Create headers for each day of the week with weekday name and date
      for (let i = 0; i < 7; i++) {
        let day = new Date(start);
        day.setDate(day.getDate() + i);
        const weekdayName = day.toLocaleString("en-US", { weekday: "long" });
        tableHeaders.innerHTML += `<th>${weekdayName}<br>${formatDate(day)}</th>`;
      }

      // Build table rows for each time slot
      timeSlots.forEach(slot => {
        let row = `<td>${slot}</td>`;
        for (let i = 0; i < 7; i++) {
          let day = new Date(start);
          day.setDate(day.getDate() + i);
          let formattedDay = formatDate(day);

          // Determine slot's full date & time
          const slotDateTime = getSlotDateTime(formattedDay, slot);
          const now = new Date();

          // Find booking matching this date and time
          const existingBooking = data.bookings.find(
            b => b.date === formattedDay && b.timeSlot === slot
          );

          let statusClass = "available";
          let statusText = "Available";

          // Mark as Past if the slot's date/time is in the past
          if (slotDateTime < now) {
            statusClass = "past";
            statusText = "Past";
          } else if (existingBooking && existingBooking.status !== "Rejected") {
            const bookingUserId = existingBooking.user?.toString();
            if (existingBooking.status === "Pending") {
              if (bookingUserId === currentUserId) {
                statusClass = "your-pending";
                statusText = "Your Pending";
              } else {
                statusClass = "pending";
                statusText = "Pending";
              }
            } else if (existingBooking.status === "Booked") {
              if (bookingUserId === currentUserId) {
                statusClass = "your-booked";
                statusText = "Your Booked";
              } else {
                statusClass = "booked";
                statusText = "Booked";
              }
            }
          }

          row += `
            <td class="slot ${statusClass}"
                data-time="${slot}"
                data-date="${formattedDay}">
                ${statusText}
            </td>
          `;
        }
        scheduleTable.innerHTML += `<tr>${row}</tr>`;
      });

      addSlotClickEvent();
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  }

  // Attach click events to slot cells
  function addSlotClickEvent() {
    document.querySelectorAll(".slot").forEach(cell => {
      cell.addEventListener("click", function () {
        toggleSlotSelection(this);
      });
    });
  }

  // Toggle selection for an available slot with 3-slot-per-day limit
  function toggleSlotSelection(cell) {
    if (
      cell.classList.contains("booked") ||
      cell.classList.contains("pending") ||
      cell.classList.contains("your-booked") ||
      cell.classList.contains("your-pending") ||
      cell.classList.contains("rejected") ||
      cell.classList.contains("past")
    ) {
      return;
    }
    const date = cell.getAttribute("data-date");
    const timeSlot = cell.getAttribute("data-time");
    const slotKey = `${date} - ${timeSlot}`;
    
    if (selectedSlots.has(slotKey)) {
      selectedSlots.delete(slotKey);
      cell.classList.remove("selected");
      cell.classList.add("available");
      cell.textContent = "Available";
    } else {
      // Count the number of slots already selected for this date
      let countForDate = 0;
      for (let s of selectedSlots) {
        const [sDate] = s.split(" - ");
        if (sDate.trim() === date.trim()) {
          countForDate++;
        }
      }
      if (countForDate >= 3) {
        alert("You can only select up to 3 slots per day!");
        return;
      }
      selectedSlots.add(slotKey);
      cell.classList.remove("available");
      cell.classList.add("selected");
      cell.textContent = "Selected";
    }
  }

  // Updated confirmBooking function to open the additional users modal
  async function confirmBooking() {
    if (selectedSlots.size === 0) {
      alert("No slots selected!");
      return;
    }
    const roomId = roomSelect.value;
    const userId = localStorage.getItem("userId");
    if (!roomId || !userId) {
      alert("Invalid booking details. Please try again.");
      return;
    }
    // Build array of slot objects
    const bookingSlots = Array.from(selectedSlots).map(slotKey => {
      const [datePart, timePart] = slotKey.split(" - ");
      return {
        date: datePart.trim(),
        timeSlot: timePart.trim()
      };
    });

    // Open modal for additional user info instead of a simple confirm dialog
    const modalInstance = new bootstrap.Modal(additionalUsersModalEl);
    modalInstance.show();

    // Store pending booking data globally for use after modal confirmation
    window.pendingBookingData = {
      roomId,
      bookingSlots,
      userId,
      roomName: roomSelect.options[roomSelect.selectedIndex].text
    };
  }

  // Add participant field in the modal
  function addParticipantField() {
    const div = document.createElement("div");
    div.classList.add("participant");
    div.innerHTML = `
      <div class="row mb-2">
        <div class="col">
          <input type="text" class="form-control participant-name" placeholder="Name" required>
        </div>
        <div class="col">
          <input type="text" class="form-control participant-phone" placeholder="Phone" required>
        </div>
        <div class="col">
          <input type="email" class="form-control participant-email" placeholder="Email" required>
        </div>
      </div>
    `;
    additionalUsersContainer.appendChild(div);
    updateParticipantCount();
  }

  // Remove the last participant field
  function removeParticipantField() {
    if (additionalUsersContainer.lastElementChild) {
      additionalUsersContainer.removeChild(additionalUsersContainer.lastElementChild);
      updateParticipantCount();
    }
  }

  function updateParticipantCount() {
    const count = additionalUsersContainer.querySelectorAll(".participant").length;
    participantCountSpan.textContent = `Participants: ${count}`;
  }

  // Handle modal confirmation of additional users
  confirmAdditionalUsersBtn.addEventListener("click", async function () {
    const participants = [];
    additionalUsersContainer.querySelectorAll(".participant").forEach(div => {
      const name = div.querySelector(".participant-name").value.trim();
      const phone = div.querySelector(".participant-phone").value.trim();
      const email = div.querySelector(".participant-email").value.trim();
      if (name && phone && email) {
        participants.push({ name, phone, email });
      }
    });
    if (participants.length < 4 || participants.length > 8) {
      alert("Please provide between 4 and 8 participant entries.");
      return;
    }

    // Hide the modal
    const modalInstance = bootstrap.Modal.getInstance(additionalUsersModalEl);
    modalInstance.hide();

    // Retrieve pending booking data
    const { roomId, bookingSlots, userId, roomName } = window.pendingBookingData;
    const bookingDetails = bookingSlots.map(b => `• ${b.date} at ${b.timeSlot}`).join("\n");
    const confirmationMessage = `Please confirm your booking details:\n\nRoom: ${roomName}\nSlots:\n${bookingDetails}\n\nDo you want to proceed?`;
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    const bookingData = {
      userId: userId,
      room: roomId,
      bookings: bookingSlots,
      additionalUsers: participants
    };

    console.log("📌 Booking Data Sent:", bookingData);

    try {
      const response = await fetch(`${BASE_URL}/api/booking/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Booking Error:", errorData);
        throw new Error(errorData.message || "Booking failed");
      }
      const result = await response.json();
      alert(result.message);
      selectedSlots.clear();
      loadSchedule();
      additionalUsersContainer.innerHTML = "";
      updateParticipantCount();
    } catch (error) {
      console.error("❌ Error confirming booking:", error);
      alert("Booking failed. Please try again.");
    }
  });

  // Initialize modal participant fields with 4 default fields
  for (let i = 0; i < 4; i++) {
    addParticipantField();
  }
  addParticipantBtn.addEventListener("click", addParticipantField);
  removeParticipantBtn.addEventListener("click", removeParticipantField);

  // Week navigation
  prevWeekBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 7);
    loadSchedule();
  });
  nextWeekBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 7);
    loadSchedule();
  });

  // Confirm booking button event
  confirmBookingBtn.addEventListener("click", confirmBooking);

  // Reload schedule when room selection changes
  roomSelect.addEventListener("change", loadSchedule);

  // Fetch rooms on page load
  fetchRooms();
});
