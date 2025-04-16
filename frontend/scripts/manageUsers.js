document.addEventListener("DOMContentLoaded", async function () {
  const usersTable = document.getElementById("usersTable");
  const userFilter = document.getElementById("userFilter");
  const addUserForm = document.getElementById("addUserForm");
  const editUserForm = document.getElementById("editUserForm"); // Edit form
  const token = localStorage.getItem("token");
  let usersData = {}; // Store fetched user data keyed by user id
  const BASE_URL = window.ENV.BASE_URL;

  if (!token) {
    alert("Unauthorized access! Please log in.");
    window.location.href = "../index.html";
    return;
  }

  // Fetch all users (both admins & regular users) from the backend
  async function fetchUsers() {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const users = await response.json();
      // Store each user in usersData for later lookup during editing
      usersData = {};
      users.forEach(user => {
        usersData[user._id] = user;
      });
      renderUsers(users);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      alert("Failed to load users. Please try again.");
    }
  }

  // Render users into the table
  function renderUsers(users) {
    usersTable.innerHTML = "";
    if (!users.length) {
      usersTable.innerHTML = `<tr><td colspan="5" class="text-center">No users found.</td></tr>`;
      return;
    }
    users.forEach((user, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td class="table-actions"></td>
      `;

      // Create the Edit button
      const editButton = document.createElement("button");
      editButton.className = "btn btn-success btn-sm";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", function () {
        editUser(user._id);
      });

      // Create the Delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        deleteUser(user._id);
      });

      const actionsCell = row.querySelector(".table-actions");
      actionsCell.appendChild(editButton);
      actionsCell.appendChild(deleteButton);

      usersTable.appendChild(row);
    });
  }

  // Delete a user/admin
  async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to delete user");
      alert("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    }
  }

  // Edit user: open edit modal, prefill fields with current user data
  function editUser(id) {
    const user = usersData[id];
    if (!user) {
      alert("User not found");
      return;
    }
    // Populate edit form fields
    document.getElementById("editUserId").value = user._id;
    document.getElementById("editUserName").value = user.name;
    document.getElementById("editUserEmail").value = user.email;
    document.getElementById("editUserPhone").value = user.phone || "";
    document.getElementById("editUserRole").value = user.role; // Expecting 'user' or 'admin'
    
    // Clear password fields
    document.getElementById("editUserPassword").value = "";
    document.getElementById("editConfirmPassword").value = "";

    // Show the edit user modal using Bootstrap's modal API
    const editUserModalEl = document.getElementById("editUserModal");
    const editUserModal = new bootstrap.Modal(editUserModalEl);
    editUserModal.show();
  }

  // Handle edit user form submission
  if (editUserForm) {
    editUserForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const id = document.getElementById("editUserId").value;
      const name = document.getElementById("editUserName").value.trim();
      const email = document.getElementById("editUserEmail").value.trim();
      const phone = document.getElementById("editUserPhone").value.trim();
      const role = document.getElementById("editUserRole").value.toLowerCase();
      const password = document.getElementById("editUserPassword").value;
      const confirmPassword = document.getElementById("editConfirmPassword").value;

      // If either password field is filled, they must match
      if (password || confirmPassword) {
        if (password !== confirmPassword) {
          alert("Passwords do not match.");
          return;
        }
      }

      // Create update payload; include password only if provided
      const updatePayload = { name, email, phone, role };
      if (password) {
        updatePayload.password = password;
      }

      try {
        const response = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });
        if (!response.ok) throw new Error("Failed to update user");
        alert("User updated successfully!");
        fetchUsers();

        // Hide the edit modal after successful update
        const editUserModalEl = document.getElementById("editUserModal");
        const modalInstance = bootstrap.Modal.getInstance(editUserModalEl);
        if (modalInstance) modalInstance.hide();
        editUserForm.reset();
      } catch (error) {
        console.error("❌ Error updating user:", error);
        alert("Failed to update user. Please try again.");
      }
    });
  }

  // Filter users by name, email, or role
  function filterUsers() {
    const filter = userFilter.value.toLowerCase();
    const rows = document.querySelectorAll("#usersTable tr");
    rows.forEach(row => {
      const name = row.children[1].textContent.toLowerCase();
      const email = row.children[2].textContent.toLowerCase();
      const role = row.children[3].textContent.toLowerCase();
      row.style.display =
        name.includes(filter) || email.includes(filter) || role.includes(filter)
          ? ""
          : "none";
    });
  }

  // Attach event listener to the filter input
  userFilter.addEventListener("keyup", filterUsers);

  // Add new user/admin
  addUserForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const phone = document.getElementById("userPhone").value.trim();
    const password = document.getElementById("userPassword").value;
    const confirmPassword = document.getElementById("ConfirmPassword").value;
    const role = document.getElementById("userRole").value.toLowerCase(); // Ensure role is in lowercase
    const isAdmin = role === "admin";

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone, password, isAdmin })
      });
      if (!response.ok) throw new Error("Failed to add user");
      alert("User added successfully!");
      fetchUsers();

      // Close the add user modal using Bootstrap's modal API, then reset the form
      const addUserModal = bootstrap.Modal.getInstance(document.getElementById("addUserModal"));
      addUserModal.hide();
      addUserForm.reset();
    } catch (error) {
      console.error("❌ Error adding user:", error);
      alert("Failed to add user. Please try again.");
    }
  });

  // Initial fetch of users on page load
  fetchUsers();
});
