/* Authentication Logic & Form Handlers with Backend API Integration */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        showToast("Please enter both email and password.", "error");
        return;
      }

      // Try Backend API Login
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (res && res.success) {
        setToken(res.token);
        saveUser(res.user);
        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
        return;
      }

      // Fallback local login simulation if offline
      let user = getStoredUser();
      if (!user || user.email !== email) {
        user = {
          fullName: email.split("@")[0].replace(".", " ").toUpperCase(),
          email: email,
          phone: "+91 98765 00000",
          dob: "2002-08-20",
          age: 24,
          gender: "Female",
          caste: "BC",
          state: "Tamil Nadu",
          district: "Chennai",
          area: "Urban",
          income: 180000,
          occupation: "Student",
          education: "Undergraduate",
          rationCard: "Rice Card",
          disabilityStatus: "No",
          firstGenGraduate: "Yes",
          govtSchoolStudied: "Yes",
          isProfileComplete: true
        };
        saveUser(user);
      }

      showToast("Login successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("fullName")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const phone = document.getElementById("phone")?.value.trim();
      const password = document.getElementById("password")?.value;
      const confirmPassword = document.getElementById("confirmPassword")?.value;

      if (!fullName || !email || !phone || !password) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
      }

      // Try Backend Registration API
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, phone, password })
      });

      if (res && res.success) {
        setToken(res.token);
        saveUser(res.user);
        showToast("Account created successfully! Set up your profile.", "success");
        setTimeout(() => {
          window.location.href = "profile-setup.html";
        }, 1000);
        return;
      } else if (res && res.message) {
        showToast(res.message, "error");
        return;
      }

      // Fallback local registration
      const newUser = {
        fullName,
        email,
        phone,
        isProfileComplete: false
      };
      saveUser(newUser);

      showToast("Account created successfully! Set up your profile.", "success");
      setTimeout(() => {
        window.location.href = "profile-setup.html";
      }, 1000);
    });
  }
});
