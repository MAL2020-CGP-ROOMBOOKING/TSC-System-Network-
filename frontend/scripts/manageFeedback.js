document.addEventListener("DOMContentLoaded", async function () {
  const feedbackTable = document.getElementById("feedbackTable");
  const token = localStorage.getItem("token");
  const BASE_URL = window.BASE_URL || window.ENV?.BASE_URL;

  const statusFilter = document.getElementById("statusFilter");
  const monthFilter = document.getElementById("filterMonth");
  const yearFilter = document.getElementById("filterYear");
  const downloadReportBtn = document.getElementById("downloadReportBtn");

  if (!token) {
    alert("Unauthorized access! Please log in.");
    window.location.href = "../../index.html";
    return;
  }

  // Fetch feedback from API
  async function fetchFeedback() {
    try {
      const response = await fetch(`${BASE_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch feedback");

      const feedbacks = await response.json();
      renderFeedback(filterFeedback(feedbacks));
    } catch (error) {
      console.error("❌ Error fetching feedback:", error);
      alert("Failed to load feedback. Please try again.");
    }
  }

  // Filter feedbacks based on dropdowns
  function filterFeedback(feedbacks) {
    const selectedStatus = statusFilter.value;
    const selectedMonth = monthFilter.value;
    const selectedYear = yearFilter.value;

    return feedbacks.filter((fb) => {
      const date = new Date(fb.createdAt || fb.date);
      const matchesStatus = selectedStatus === "All" || fb.status === selectedStatus;
      const matchesMonth = !selectedMonth || String(date.getMonth() + 1).padStart(2, "0") === selectedMonth;
      const matchesYear = !selectedYear || date.getFullYear().toString() === selectedYear;
      return matchesStatus && matchesMonth && matchesYear;
    });
  }

  // Render the feedback list
  function renderFeedback(feedbacks) {
    feedbackTable.innerHTML = "";

    if (feedbacks.length === 0) {
      feedbackTable.innerHTML = `
        <tr>
          <td colspan="9" class="text-center">No feedback found.</td>
        </tr>`;
      return;
    }

    feedbacks.forEach((feedback, index) => {
      const userName = feedback.user?.name || "Anonymous";
      const userEmail = feedback.user?.email || "N/A";

      const statusDropdown = `
        <select class="form-select form-select-sm status-select" data-id="${feedback._id}">
          <option value="Pending" ${feedback.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Reviewed" ${feedback.status === "Reviewed" ? "selected" : ""}>Reviewed</option>
          <option value="Resolved" ${feedback.status === "Resolved" ? "selected" : ""}>Resolved</option>
        </select>
      `;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${userName}</td>
        <td>${userEmail}</td>
        <td>${feedback.category || ""}</td>
        <td>${feedback.subject || ""}</td>
        <td>${feedback.message || ""}</td>
        <td>${feedback.rating || "No Rating"}</td>
        <td>${statusDropdown}</td>
        <td class="table-actions d-flex flex-wrap">
          <button class="btn btn-sm btn-danger">Delete</button>
        </td>
      `;

      // Attach delete functionality
      row.querySelector(".btn-danger").addEventListener("click", () => {
        deleteFeedback(feedback._id);
      });

      feedbackTable.appendChild(row);
    });

    // Attach status change handler after rendering
    document.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async function () {
        const feedbackId = this.dataset.id;
        const newStatus = this.value;

        try {
          const res = await fetch(`${BASE_URL}/api/feedback/status/${feedbackId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          });

          if (!res.ok) throw new Error("Failed to update status");
          alert("Status updated.");
          fetchFeedback();
        } catch (err) {
          console.error("❌ Error updating status:", err);
          alert("Failed to update status. Please try again.");
        }
      });
    });
  }

  // Delete feedback
  async function deleteFeedback(id) {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const response = await fetch(`${BASE_URL}/api/feedback/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete feedback");

      alert("Feedback deleted.");
      fetchFeedback();
    } catch (error) {
      console.error("❌ Error deleting feedback:", error);
      alert("Failed to delete feedback. Please try again.");
    }
  }

  // Download table as CSV
  downloadReportBtn.addEventListener("click", () => {
    const rows = [...feedbackTable.querySelectorAll("tr")].map(row =>
      [...row.children].map(cell => `"${cell.innerText.replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "feedback_records.csv";
    link.click();
  });

  // Filter event listeners
  [statusFilter, monthFilter, yearFilter].forEach(el => {
    el.addEventListener("change", fetchFeedback);
  });

  // Init
  fetchFeedback();
});
