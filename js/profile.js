/* Multi-step Profile Wizard & Profile Management */

let currentStep = 1;
const totalSteps = 4;

document.addEventListener("DOMContentLoaded", () => {
  const wizardForm = document.getElementById("profile-wizard-form");
  const dobInput = document.getElementById("dob");
  const ageDisplay = document.getElementById("calculated-age");

  // Load existing profile details if available
  const existingUser = getStoredUser();
  if (existingUser && wizardForm) {
    populateWizardFields(existingUser);
  }

  // Automatic Age Calculation from DOB
  if (dobInput) {
    dobInput.addEventListener("change", () => {
      const age = calculateAgeFromDOB(dobInput.value);
      if (ageDisplay) {
        ageDisplay.value = `${age} Years Old`;
      }
    });
  }

  // Multi-step Next / Prev buttons
  window.nextWizardStep = function(step) {
    if (!validateWizardStep(currentStep)) return;
    if (step <= totalSteps) {
      currentStep = step;
      updateWizardUI();
    }
  };

  window.prevWizardStep = function(step) {
    if (step >= 1) {
      currentStep = step;
      updateWizardUI();
    }
  };

  if (wizardForm) {
    wizardForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateWizardStep(currentStep)) return;

      const updatedUser = {
        ...(getStoredUser() || {}),
        fullName: document.getElementById("fullName")?.value || "Citizen",
        email: document.getElementById("email")?.value || "",
        phone: document.getElementById("phone")?.value || "",
        dob: document.getElementById("dob")?.value || "2000-01-01",
        age: calculateAgeFromDOB(document.getElementById("dob")?.value || "2000-01-01"),
        gender: document.getElementById("gender")?.value || "Female",
        caste: document.getElementById("caste")?.value || "BC",
        state: "Tamil Nadu",
        district: document.getElementById("district")?.value || "Chennai",
        area: document.getElementById("area")?.value || "Urban",
        income: parseInt(document.getElementById("income")?.value || "200000"),
        occupation: document.getElementById("occupation")?.value || "Student",
        education: document.getElementById("education")?.value || "Undergraduate",
        rationCard: document.getElementById("rationCard")?.value || "Rice Card",
        disabilityStatus: document.getElementById("disabilityStatus")?.value || "No",
        firstGenGraduate: document.getElementById("firstGenGraduate")?.value || "No",
        govtSchoolStudied: document.getElementById("govtSchoolStudied")?.value || "No",
        isProfileComplete: true
      };

      saveUser(updatedUser);
      showToast("Profile saved successfully! Matching schemes...", "success");
      setTimeout(() => {
        window.location.href = "eligible-schemes.html";
      }, 1200);
    });
  }

  // Profile View & Edit Page Handler
  const profilePageForm = document.getElementById("user-profile-edit-form");
  if (profilePageForm) {
    const user = getStoredUser();
    if (user) {
      populateProfilePageFields(user);
    }

    profilePageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        ...user,
        fullName: document.getElementById("profile-name").value,
        phone: document.getElementById("profile-phone").value,
        district: document.getElementById("profile-district").value,
        income: parseInt(document.getElementById("profile-income").value),
        occupation: document.getElementById("profile-occupation").value,
        education: document.getElementById("profile-education").value,
        caste: document.getElementById("profile-caste").value
      };
      saveUser(updated);
      showToast("Profile updated successfully!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
});

function updateWizardUI() {
  for (let i = 1; i <= totalSteps; i++) {
    const stepContent = document.getElementById(`wizard-step-${i}`);
    const stepNode = document.getElementById(`step-node-${i}`);
    if (stepContent) {
      stepContent.classList.toggle("active", i === currentStep);
    }
    if (stepNode) {
      stepNode.classList.toggle("active", i === currentStep);
      stepNode.classList.toggle("completed", i < currentStep);
    }
  }

  const line = document.getElementById("wizard-progress-line");
  if (line) {
    const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    line.style.width = `${percentage}%`;
  }
}

function validateWizardStep(step) {
  if (step === 1) {
    const dob = document.getElementById("dob")?.value;
    const gender = document.getElementById("gender")?.value;
    if (!dob || !gender) {
      showToast("Please enter Date of Birth and Gender", "error");
      return false;
    }
  } else if (step === 2) {
    const district = document.getElementById("district")?.value;
    if (!district) {
      showToast("Please select your District", "error");
      return false;
    }
  } else if (step === 3) {
    const income = document.getElementById("income")?.value;
    const occupation = document.getElementById("occupation")?.value;
    if (!income || !occupation) {
      showToast("Please specify Annual Income and Occupation", "error");
      return false;
    }
  }
  return true;
}

function populateWizardFields(user) {
  if (user.fullName && document.getElementById("fullName")) document.getElementById("fullName").value = user.fullName;
  if (user.email && document.getElementById("email")) document.getElementById("email").value = user.email;
  if (user.phone && document.getElementById("phone")) document.getElementById("phone").value = user.phone;
  if (user.dob && document.getElementById("dob")) {
    document.getElementById("dob").value = user.dob;
    const age = calculateAgeFromDOB(user.dob);
    if (document.getElementById("calculated-age")) document.getElementById("calculated-age").value = `${age} Years Old`;
  }
  if (user.gender && document.getElementById("gender")) document.getElementById("gender").value = user.gender;
  if (user.caste && document.getElementById("caste")) document.getElementById("caste").value = user.caste;
  if (user.district && document.getElementById("district")) document.getElementById("district").value = user.district;
  if (user.area && document.getElementById("area")) document.getElementById("area").value = user.area;
  if (user.income && document.getElementById("income")) document.getElementById("income").value = user.income;
  if (user.occupation && document.getElementById("occupation")) document.getElementById("occupation").value = user.occupation;
  if (user.education && document.getElementById("education")) document.getElementById("education").value = user.education;
}

function populateProfilePageFields(user) {
  if (document.getElementById("profile-name")) document.getElementById("profile-name").value = user.fullName || "";
  if (document.getElementById("profile-email")) document.getElementById("profile-email").value = user.email || "";
  if (document.getElementById("profile-phone")) document.getElementById("profile-phone").value = user.phone || "";
  if (document.getElementById("profile-district")) document.getElementById("profile-district").value = user.district || "Chennai";
  if (document.getElementById("profile-income")) document.getElementById("profile-income").value = user.income || 200000;
  if (document.getElementById("profile-occupation")) document.getElementById("profile-occupation").value = user.occupation || "Student";
  if (document.getElementById("profile-education")) document.getElementById("profile-education").value = user.education || "Undergraduate";
  if (document.getElementById("profile-caste")) document.getElementById("profile-caste").value = user.caste || "BC";

  // Summary Card text
  if (document.getElementById("profile-display-name")) document.getElementById("profile-display-name").innerText = user.fullName || "Citizen Profile";
  if (document.getElementById("profile-display-meta")) document.getElementById("profile-display-meta").innerText = `${user.age || 22} Yrs Old • ${user.district || 'Chennai'}, TN`;
}
