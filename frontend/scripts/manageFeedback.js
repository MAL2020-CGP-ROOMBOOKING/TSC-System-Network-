document.addEventListener("DOMContentLoaded", async function () {
    const feedbackTable = document.getElementById("feedbackTable");
    const token = localStorage.getItem("token");
    const BASE_URL = window.ENV.BASE_URL;
  
    if (!token) {
      alert("Unauthorized access! Please log in.");
      window.location.href = "../index.html";
      return;
    }
  
    // Fetch all feedback (for admin)
    async function fetchFeedback() {
      try {
        const response = await fetch(`${BASE_URL}/api/feedback`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) throw new Error("Failed to fetch feedback");
  
        const feedbacks = await response.json();
        renderFeedback(feedbacks);
      } catch (error) {
        console.error("❌ Error fetching feedback:", error);
        alert("Failed to load feedback. Please try again.");
      }
    }
  
    // Render feedback in the table
    function renderFeedback(feedbacks) {
      feedbackTable.innerHTML = "";
  
      if (!feedbacks.length) {
        feedbackTable.innerHTML = `
          <tr>
            <td colspan="9" class="text-center">No feedback found.</td>
          </tr>
        `;
        return;
      }
  
      feedbacks.forEach((feedback, index) => {
        const userName = feedback.user?.name || "Anonymous";
        const userEmail = feedback.user?.email || "N/A";
  
        // Create table row
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${userName}</td>
          <td>${userEmail}</td>
          <td>${feedback.category || ""}</td>
          <td>${feedback.subject || ""}</td>
          <td>${feedback.message || ""}</td>
          <td>${feedback.rating || "No Rating"}</td>
          <td>${feedback.status || ""}</td>
          <td class="table-actions"></td>
        `;
  
        // Append row to table first
        feedbackTable.appendChild(row);
  
        // Now create the Delete button in JS and attach an event listener
        const actionsCell = row.querySelector(".table-actions");
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
          deleteFeedback(feedback._id);
        });
        actionsCell.appendChild(deleteButton);
      });
    }
  
    // Delete feedback function
    async function deleteFeedback(id) {
      if (!confirm("Are you sure you want to delete this feedback?")) return;
  
      try {
        console.log(`Deleting feedback with ID: ${id}`); // Debugging log
  
        const response = await fetch(`${BASE_URL}/api/feedback/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Failed to delete feedback: ${errorMsg}`);
        }
  
        alert("Feedback deleted successfully!");
        fetchFeedback();
      } catch (error) {
        console.error("❌ Error deleting feedback:", error);
        alert("Failed to delete feedback. Please try again.");
      }
    }
  
    // Initial fetch of feedback on page load
    fetchFeedback();
  });
  