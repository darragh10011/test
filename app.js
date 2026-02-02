const form = document.getElementById("application-form");
const statusEl = document.getElementById("form-status");
const submitButton = document.getElementById("submit-button");
const successPanel = document.getElementById("success-panel");
const roleRadios = Array.from(document.querySelectorAll("input[name='role']"));
const interviewerFields = document.getElementById("interviewer-fields");
const authorFields = document.getElementById("author-fields");
const bioField = document.getElementById("bio");
const motivationField = document.getElementById("motivation");
const bioCounter = document.getElementById("bio-counter");
const motivationCounter = document.getElementById("motivation-counter");

const requiredWhenInterviewer = [
  "interviewing-experience",
  "sensitive-topics",
];
const requiredWhenAuthor = [
  "writing-experience",
  "genres",
  "writing-sample",
];
const maxFileSize = 10 * 1024 * 1024;
const allowedExtensions = ["pdf", "doc", "docx"];

const updateCounters = () => {
  bioCounter.textContent = `${bioField.value.length} / 600`;
  motivationCounter.textContent = `${motivationField.value.length} / 700`;
};

const setError = (fieldId, message) => {
  const errorEl = document.getElementById(`error-${fieldId}`);
  if (errorEl) {
    errorEl.textContent = message;
  }
};

const clearErrors = () => {
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });
  statusEl.textContent = "";
};

const getSelectedRole = () => {
  const selected = roleRadios.find((radio) => radio.checked);
  return selected ? selected.value : "";
};

const toggleConditionalFields = () => {
  const role = getSelectedRole();
  const showInterviewer = role === "Interviewer" || role === "Both";
  const showAuthor = role === "Author" || role === "Both";
  interviewerFields.hidden = !showInterviewer;
  authorFields.hidden = !showAuthor;
};

const validateFile = (input, required) => {
  const files = input.files;
  if (!files || files.length === 0) {
    return required ? "This file is required." : "";
  }
  const file = files[0];
  const extension = file.name.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return "File must be a PDF, DOC, or DOCX.";
  }
  if (file.size > maxFileSize) {
    return "File must be 10MB or smaller.";
  }
  return "";
};

const validateForm = () => {
  clearErrors();
  const errors = [];

  const requiredFields = [
    "full-name",
    "email",
    "timezone",
    "bio",
    "motivation",
    "experience",
    "availability",
  ];

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      setError(fieldId, "This field is required.");
      errors.push(fieldId);
    }
  });

  if (!getSelectedRole()) {
    setError("role", "Please select a role.");
    errors.push("role");
  }

  if (bioField.value.trim().length < 120) {
    setError("bio", "Please write at least 120 characters.");
    errors.push("bio");
  }

  if (motivationField.value.trim().length < 120) {
    setError("motivation", "Please write at least 120 characters.");
    errors.push("motivation");
  }

  const role = getSelectedRole();
  const needsInterviewer = role === "Interviewer" || role === "Both";
  const needsAuthor = role === "Author" || role === "Both";

  if (needsInterviewer) {
    requiredWhenInterviewer.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        setError(fieldId, "This field is required for interviewers.");
        errors.push(fieldId);
      }
    });
  }

  if (needsAuthor) {
    requiredWhenAuthor.forEach((fieldId) => {
      if (fieldId === "writing-sample") {
        const fileInput = document.getElementById(fieldId);
        const message = validateFile(fileInput, true);
        if (message) {
          setError(fieldId, message);
          errors.push(fieldId);
        }
      } else {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
          setError(fieldId, "This field is required for authors.");
          errors.push(fieldId);
        }
      }
    });
  }

  const portfolio = document.getElementById("portfolio");
  if (needsAuthor && !portfolio.value.trim()) {
    setError("portfolio", "Portfolio link is required for Author or Both.");
    errors.push("portfolio");
  }

  const resumeInput = document.getElementById("resume");
  const resumeMessage = validateFile(resumeInput, false);
  if (resumeMessage) {
    setError("resume", resumeMessage);
    errors.push("resume");
  }

  const consent = document.getElementById("consent");
  if (!consent.checked) {
    setError("consent", "Please confirm the consent statement.");
    errors.push("consent");
  }

  return errors;
};

const scrollToInvalid = (fieldId) => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.focus({ preventScroll: false });
    field.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const showSuccessPanel = () => {
  successPanel.hidden = false;
  successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

const handleSuccessState = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true" || window.location.hash === "#success") {
    showSuccessPanel();
  }
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const errors = validateForm();
  if (errors.length > 0) {
    statusEl.textContent = `Please correct ${errors.length} field${errors.length > 1 ? "s" : ""} highlighted below.`;
    scrollToInvalid(errors[0]);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  statusEl.textContent = "Submitting…";

  const formData = new FormData(form);

  if (window.location.protocol === "file:") {
    showSuccessPanel();
    form.reset();
    toggleConditionalFields();
    updateCounters();
    submitButton.disabled = false;
    submitButton.textContent = "Submit application";
    statusEl.textContent = "Your application was captured locally.";
    return;
  }

  try {
    const response = await fetch(form.getAttribute("action") || "/", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showSuccessPanel();
      form.reset();
      toggleConditionalFields();
      updateCounters();
      statusEl.textContent = "Application received.";
    } else {
      statusEl.textContent = "Submission failed. Please try again.";
    }
  } catch (error) {
    statusEl.textContent = "Submission failed. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit application";
  }
};

const enableSmoothScroll = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.style.scrollBehavior = "auto";
    return;
  }
  document.documentElement.style.scrollBehavior = "smooth";
};

roleRadios.forEach((radio) => {
  radio.addEventListener("change", toggleConditionalFields);
});

bioField.addEventListener("input", updateCounters);
motivationField.addEventListener("input", updateCounters);
form.addEventListener("submit", handleSubmit);

updateCounters();
toggleConditionalFields();
handleSuccessState();
enableSmoothScroll();
