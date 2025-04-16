document.addEventListener("DOMContentLoaded", function () {
  const announcementTable = document.getElementById("announcementTable");
  const addAnnouncementForm = document.getElementById("addAnnouncementForm");
  const editAnnouncementForm = document.getElementById("editAnnouncementForm");

  // Modal & form elements for editing
  const editAnnouncementModalEl = document.getElementById("editAnnouncementModal");
  const editAnnouncementModal = new bootstrap.Modal(editAnnouncementModalEl);
  const editAnnouncementId = document.getElementById("editAnnouncementId");
  const editAnnouncementTitle = document.getElementById("editAnnouncementTitle");
  const editAnnouncementMessage = document.getElementById("editAnnouncementMessage");
  const editAnnouncementDate = document.getElementById("editAnnouncementDate");
  const editSendEmailAll = document.getElementById("editSendEmailAll"); // optional checkbox

  const BASE_URL = window.ENV.BASE_URL;
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Unauthorized access! Please log in.");
    window.location.href = "../index.html";
    return;
  }

  // 1. Fetch announcements from the API
  async function fetchAnnouncements() {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const announcements = await res.json();
      renderAnnouncements(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      alert("Failed to load announcements.");
    }
  }

  // 2. Render announcements into the table (no inline onclick)
  function renderAnnouncements(announcements) {
    announcementTable.innerHTML = "";
    if (!announcements.length) {
      announcementTable.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No announcements found.</td>
        </tr>`;
      return;
    }

    announcements.forEach((ann, index) => {
      // Convert announcement date to "YYYY-MM-DD" format
      const formattedDate = new Date(ann.date).toISOString().split("T")[0];

      const row = document.createElement("tr");

      // # (ID)
      const indexCell = document.createElement("td");
      indexCell.textContent = index + 1;
      row.appendChild(indexCell);

      // Title
      const titleCell = document.createElement("td");
      titleCell.textContent = ann.title;
      row.appendChild(titleCell);

      // Message
      const messageCell = document.createElement("td");
      messageCell.textContent = ann.message;
      row.appendChild(messageCell);

      // Date
      const dateCell = document.createElement("td");
      dateCell.textContent = formattedDate;
      row.appendChild(dateCell);

      // Actions (Edit / Delete)
      const actionsCell = document.createElement("td");

      // Edit Button
      const editButton = document.createElement("button");
      editButton.className = "btn btn-warning btn-sm";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        openEditAnnouncement(ann);
      });
      actionsCell.appendChild(editButton);

      // Delete Button
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger btn-sm ms-2";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        deleteAnnouncement(ann._id);
      });
      actionsCell.appendChild(deleteButton);

      row.appendChild(actionsCell);
      announcementTable.appendChild(row);
    });
  }

  // 3. Add a new announcement
  addAnnouncementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("announcementTitle").value.trim();
    const message = document.getElementById("announcementMessage").value.trim();
    const date = document.getElementById("announcementDate").value; // "YYYY-MM-DD"
    const sendEmailAllCheckbox = document.getElementById("sendEmailAll");
    const sendEmailAll = sendEmailAllCheckbox ? sendEmailAllCheckbox.checked : false;

    if (!title || !message || !date) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message, date, sendEmailAll }),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      alert("Announcement added successfully!");

      // Close modal
      const addAnnouncementModalEl = document.getElementById("addAnnouncementModal");
      const addAnnouncementModal = bootstrap.Modal.getInstance(addAnnouncementModalEl);
      addAnnouncementModal.hide();

      addAnnouncementForm.reset();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error adding announcement:", error);
      alert("Failed to add announcement.");
    }
  });

  // 4. Open the edit announcement modal (populate fields)
  function openEditAnnouncement(announcement) {
    editAnnouncementId.value = announcement._id;
    editAnnouncementTitle.value = announcement.title;
    editAnnouncementMessage.value = announcement.message;
    const isoDate = new Date(announcement.date).toISOString().split("T")[0];
    editAnnouncementDate.value = isoDate;

    if (editSendEmailAll) {
      editSendEmailAll.checked = false; // reset checkbox
    }

    editAnnouncementModal.show();
  }

  // 5. Save changes to an announcement (PUT request)
  editAnnouncementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = editAnnouncementId.value;
    const title = editAnnouncementTitle.value.trim();
    const message = editAnnouncementMessage.value.trim();
    const date = editAnnouncementDate.value; // "YYYY-MM-DD"
    const sendEmailAll = editSendEmailAll ? editSendEmailAll.checked : false;

    if (!title || !message || !date) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message, date, sendEmailAll }),
      });
      if (!res.ok) throw new Error("Failed to update announcement");

      alert("Announcement updated successfully!");
      editAnnouncementModal.hide();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error updating announcement:", error);
      alert("Failed to update announcement.");
    }
  });

  // 6. Delete an announcement
  async function deleteAnnouncement(id) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete announcement");

      alert("Announcement deleted successfully!");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement.");
    }
  }

  // Initial load of announcements
  fetchAnnouncements();
});
