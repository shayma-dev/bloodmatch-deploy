// src/utils/validators.js
import { BLOOD_TYPES } from "./constants.js";
import { URGENCY } from "./constants.js";

export function validateCreateRequest(form) {
  const errors = {};

  if (!BLOOD_TYPES.includes(form.bloodType)) {
    errors.bloodType = "Choose a valid blood type.";
  }

  const units = Number(form.unitsNeeded);
  if (!Number.isInteger(units) || units < 1) {
    errors.unitsNeeded = "Units must be a positive integer.";
  }

  if (!URGENCY.includes(form.urgency)) {
    errors.urgency = "Choose a valid urgency.";
  }

  if (!form.caseDescription || !form.caseDescription.trim()) {
    errors.caseDescription = "Case description is required.";
  } else if (form.caseDescription.length > 300) {
    errors.caseDescription = "Max 300 characters.";
  }

  // City/Country are optional per your comment (server defaults from requester profile if omitted)
  // If you decide to make them required later, just add checks here.

  return errors;
}


export function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function minLength(value, len) {
  return (value || "").length >= len;
}


export function isYYYYMMDD(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const d = new Date(value);
  // Check that the date object matches the string (avoids 2025-02-31 becoming Mar 3)
  const [y, m, day] = value.split("-").map(Number);
  return (
    d instanceof Date &&
    !Number.isNaN(d.valueOf()) &&
    d.getUTCFullYear() === y &&
    d.getUTCMonth() + 1 === m &&
    d.getUTCDate() === day
  );
}