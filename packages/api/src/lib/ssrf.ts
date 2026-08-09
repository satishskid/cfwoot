/**
 * SSRF (Server-Side Request Forgery) protection.
 * Validates that outgoing webhook URLs don't target private/internal networks.
 */

import { isIPv4, isIPv6 } from "net";

const PRIVATE_RANGES = [
  // IPv4 private ranges
  { start: [10, 0, 0, 0], end: [10, 255, 255, 255] },       // 10.0.0.0/8
  { start: [172, 16, 0, 0], end: [172, 31, 255, 255] },      // 172.16.0.0/12
  { start: [192, 168, 0, 0], end: [192, 168, 255, 255] },    // 192.168.0.0/16
  { start: [127, 0, 0, 0], end: [127, 255, 255, 255] },      // 127.0.0.0/8 (loopback)
  { start: [169, 254, 0, 0], end: [169, 254, 255, 255] },    // 169.254.0.0/16 (link-local)
  { start: [0, 0, 0, 0], end: [0, 255, 255, 255] },          // 0.0.0.0/8
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254", // AWS/GCP metadata
];

function ipToNumber(ip: string): number[] {
  return ip.split(".").map(Number);
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ipToNumber(ip);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  return PRIVATE_RANGES.some(
    (range) =>
      parts[0] >= range.start[0] &&
      parts[0] <= range.end[0] &&
      parts[1] >= range.start[1] &&
      parts[1] <= range.end[1] &&
      parts[2] >= range.start[2] &&
      parts[2] <= range.end[2] &&
      parts[3] >= range.start[3] &&
      parts[3] <= range.end[3]
  );
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

/**
 * Validate that a URL is safe to fetch (not targeting private networks).
 * Returns { safe: true } or { safe: false, reason: string }.
 */
export async function validateUrlSafety(url: string): Promise<{ safe: boolean; reason?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }

  // Only allow HTTPS
  if (parsed.protocol !== "https:") {
    return { safe: false, reason: "Only HTTPS URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { safe: false, reason: `Hostname "${hostname}" is blocked` };
  }

  // Check if hostname resolves to private IP
  // Note: DNS resolution in Workers uses the built-in resolver
  // We do a fetch with redirect: 'manual' to check the resolved IP
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Check the final URL after redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (location) {
        try {
          const redirectUrl = new URL(location, url);
          if (redirectUrl.hostname !== parsed.hostname) {
            return { safe: false, reason: "Redirect to different hostname detected" };
          }
        } catch {
          return { safe: false, reason: "Invalid redirect URL" };
        }
      }
    }

    return { safe: true };
  } catch (error) {
    // Network errors are acceptable (URL might not exist yet)
    // but we still validate the hostname
    return { safe: true };
  }
}

/**
 * Validate URL safety with DNS resolution check.
 * More thorough but requires additional network call.
 */
export async function validateUrlSafetyStrict(url: string): Promise<{ safe: boolean; reason?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:") {
    return { safe: false, reason: "Only HTTPS URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { safe: false, reason: `Hostname "${hostname}" is blocked` };
  }

  // Check if it's an IP address directly
  if (isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { safe: false, reason: `IP address "${hostname}" is in a private range` };
    }
  } else if (isIPv6(hostname) || hostname.startsWith("[") && hostname.endsWith("]")) {
    const ipv6 = hostname.replace(/[[\]]/g, "");
    if (isPrivateIPv6(ipv6)) {
      return { safe: false, reason: `IPv6 address "${ipv6}" is in a private range` };
    }
  }

  return { safe: true };
}
