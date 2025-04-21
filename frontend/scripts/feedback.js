document.getElementById("feedbackForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const category = document.getElementById("category").value;
  const subject = document.getElementById("subject").value.trim();
  const message = document.getElementById("message").value.trim();
  const anonymous = document.getElementById("anonymous").checked;

  const data = {
    category,
    subject,
    message,
    anonymous
  };

  try {
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to submit feedback");

    const result = await response.json();
    alert(result.message);
    document.getElementById("feedbackForm").reset();
    loadFeedbackHistory();
  } catch (error) {
    console.error("Error submitting feedback:", error);
    alert("Failed to submit feedback. Please try again.");
  }
});

async function loadFeedbackHistory() {
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/user`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch feedback history");

    const feedbacks = await response.json();
    const historyList = document.getElementById("feedbackHistory");
    historyList.innerHTML = "";

    if (!feedbacks.length) {
      historyList.innerHTML = `<li class="list-group-item text-center">No feedback found.</li>`;
      return;
    }

    feedbacks.forEach((fb) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `
        <strong>${fb.subject}</strong>
        <p>${fb.message}</p>
        <small>Category: ${fb.category}</small><br>
        <small>Rating: ${fb.rating || "N/A"}</small>
      `;
      historyList.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading feedback history:", error);
  }
}

// Load history on page load
window.addEventListener("DOMContentLoaded", loadFeedbackHistory);
