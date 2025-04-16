
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const BASE_URL = window.ENV.BASE_URL;
  
    if (!token || role !== "admin") {
      alert("Unauthorized access! Redirecting to login.");
      window.location.href = "../../index.html";
      return;
    }
  
    const roomList = document.getElementById("roomsTable");
    const addRoomForm = document.getElementById("addRoomForm");
  
    // 1. Load & Display All Rooms
    async function loadRooms() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Unauthorized access! Redirecting to login.");
          window.location.href = "../../index.html";
          return;
        }
  
        const response = await fetch(`${BASE_URL}/api/rooms`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "../../index.html";
          return;
        }
  
        const rooms = await response.json();
        roomList.innerHTML = "";
  
        if (!Array.isArray(rooms)) {
          console.error("Unexpected API response:", rooms);
          throw new Error("Invalid response format");
        }
  
        // Build table rows with event listeners
        rooms.forEach((room, index) => {
          const row = document.createElement("tr");
  
          // # / ID
          const indexCell = document.createElement("td");
          indexCell.textContent = index + 1;
          row.appendChild(indexCell);
  
          // Room Name
          const nameCell = document.createElement("td");
          nameCell.textContent = room.name;
          row.appendChild(nameCell);
  
          // Room Type
          const typeCell = document.createElement("td");
          typeCell.textContent = room.type;
          row.appendChild(typeCell);
  
          // Status
          const statusCell = document.createElement("td");
          const statusBadge = document.createElement("span");
          statusBadge.classList.add(
            "badge",
            `bg-${room.status === "Available" ? "success" : "danger"}`
          );
          statusBadge.textContent = room.status;
          statusCell.appendChild(statusBadge);
          row.appendChild(statusCell);
  
          // Actions
          const actionsCell = document.createElement("td");
  
          // Toggle Status Button
          const toggleButton = document.createElement("button");
          toggleButton.className = `btn btn-${
            room.status === "Available" ? "warning" : "success"
          } btn-sm`;
          toggleButton.textContent =
            room.status === "Available" ? "Disable" : "Enable";
          toggleButton.addEventListener("click", () => {
            // If the room is "Available", set it to "Maintenance"
            // otherwise set it to "Available"
            const newStatus = room.status === "Available" ? "Maintenance" : "Available";
            toggleRoomStatus(room._id, newStatus);
          });
          actionsCell.appendChild(toggleButton);
  
          // Delete Button
          const deleteButton = document.createElement("button");
          deleteButton.className = "btn btn-danger btn-sm ms-2";
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => {
            if (!confirm("Are you sure you want to delete this room?")) return;
            deleteRoom(room._id);
          });
          actionsCell.appendChild(deleteButton);
  
          row.appendChild(actionsCell);
          roomList.appendChild(row);
        });
      } catch (error) {
        console.error("Error loading rooms:", error);
        roomList.innerHTML = "<tr><td colspan='5'>Failed to load rooms</td></tr>";
      }
    }
  
    // 2. Toggle Room Status (Enable/Disable)
    async function toggleRoomStatus(roomId, newStatus) {
      try {
        const response = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
  
        const result = await response.json();
        alert(result.message);
        loadRooms();
      } catch (error) {
        console.error("Error updating room status:", error);
        alert("Failed to update room status. Please try again.");
      }
    }
  
    // 3. Delete a Room
    async function deleteRoom(roomId) {
      try {
        const response = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const result = await response.json();
        alert(result.message);
        loadRooms();
      } catch (error) {
        console.error("Error deleting room:", error);
        alert("Failed to delete room. Please try again.");
      }
    }
  
    // 4. Add a New Room
    addRoomForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const name = document.getElementById("roomName").value.trim();
      const type = document.getElementById("roomType").value;
  
      try {
        const response = await fetch(`${BASE_URL}/api/rooms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, type, status: "Available" }),
        });
  
        const result = await response.json();
        alert(result.message);
        loadRooms();
      } catch (error) {
        console.error("Error adding room:", error);
        alert("Failed to add room. Please try again.");
      }
    });
  
    // Initial Load
    loadRooms();
  });
  