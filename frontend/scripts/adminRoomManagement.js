document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Fetch BASE_URL from the global window.ENV object
    const BASE_URL = window.ENV.BASE_URL; // Use BASE_URL from the window object

    // Check for valid admin role
    if (!token || role.toLowerCase() !== "admin") {
        alert("Unauthorized access! Redirecting to login.");
        window.location.href = "../../index.html";
        return;
    }

    const roomList = document.getElementById("roomsTable");
    const addRoomForm = document.getElementById("addRoomForm");

    // ✅ Fetch and display all rooms dynamically
    async function loadRooms() {
        try {
            const response = await fetch(`${BASE_URL}/api/rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch rooms.");

            const rooms = await response.json();
            roomList.innerHTML = ""; // Clear the existing table

            rooms.forEach((room, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${room.name}</td>
                    <td>${room.type}</td>
                    <td><span class="badge bg-${room.status === "Available" ? "success" : "danger"}">${room.status}</span></td>
                    <td>
                        <button class="btn btn-${room.status === "Available" ? "warning" : "success"} btn-sm" 
                            onclick="toggleRoomStatus('${room._id}', '${room.status === "Available" ? "Maintenance" : "Available"}')">
                            ${room.status === "Available" ? "Disable" : "Enable"}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteRoom('${room._id}')">Delete</button>
                    </td>
                `;
                roomList.appendChild(row);
            });
        } catch (error) {
            console.error("❌ Error loading rooms:", error);
            roomList.innerHTML = "<tr><td colspan='5' class='text-danger text-center'>Failed to load rooms</td></tr>";
        }
    }

    // ✅ Toggle room availability (Maintenance / Available)
    async function toggleRoomStatus(roomId, newStatus) {
        try {
            const response = await fetch(`${BASE_URL}/api/rooms/update/${roomId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error("Failed to update room status.");

            const result = await response.json();
            alert(result.message);
            loadRooms();
        } catch (error) {
            console.error("❌ Error updating room status:", error);
            alert("Error updating room. Please try again.");
        }
    }

    // ✅ Delete a room with confirmation
    async function deleteRoom(roomId) {
        if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;

        try {
            const response = await fetch(`${BASE_URL}/api/rooms/delete/${roomId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to delete room.");

            const result = await response.json();
            alert(result.message);
            loadRooms();
        } catch (error) {
            console.error("❌ Error deleting room:", error);
            alert("Error deleting room. Please try again.");
        }
    }

    // ✅ Handle new room creation
    addRoomForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("roomName").value.trim();
        const type = document.getElementById("roomType").value;

        if (!name || !type) {
            alert("Please enter room name and select room type.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/rooms/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, type, status: "Available" }),
            });

            if (!response.ok) throw new Error("Failed to add new room.");

            const result = await response.json();
            alert(result.message);
            addRoomForm.reset();
            loadRooms();
        } catch (error) {
            console.error("❌ Error adding room:", error);
            alert("Error adding room. Please try again.");
        }
    });

    // Logout function for clearing session data and redirecting
    function logout() {
        console.warn("Logging out user..."); // Debugging log
        localStorage.clear();
        window.location.href = "../../index.html"; // Redirect to login page or homepage
    }

    // Initial load of rooms
    loadRooms();
});
