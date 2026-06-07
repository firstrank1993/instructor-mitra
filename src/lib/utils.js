import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine Tailwind classes safely
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format timestamp
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('en-IN');
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check if date is expired
export function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const expiry = expiryDate?.toDate ? expiryDate.toDate() : new Date(expiryDate);
  return new Date() > expiry;
}

// Delay function for batch writes
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Round to integer
export function toInt(num) {
  return Math.round(num);
}

// Calculate percentage
export function calcPercentage(obtained, total) {
  if (!total) return 0;
  return Math.round((obtained / total) * 100);
}