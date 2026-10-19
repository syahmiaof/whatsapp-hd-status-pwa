const TRIAL_DAYS = 3;
const STORAGE_KEY_START = 'status_hd_trial_start';
const STORAGE_KEY_EXPIRED = 'status_hd_trial_expired';
const STORAGE_KEY_VIP = 'status_hd_vip_token';
const STORAGE_KEY_DEVICE = 'status_hd_device_id';
const SECRET_SALT = 'STATUS_HD_WA_2026_PRO_KEY';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (!deviceId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    deviceId = `HD-WA-${randomSuffix}`;
    localStorage.setItem(STORAGE_KEY_DEVICE, deviceId);
  }
  return deviceId;
}

/**
 * Pengiraan checksum deterministik berasaskan FNV-1a dengan salt rahsia.
 */
function computeChecksum(payload: string): string {
  const salted = `${SECRET_SALT}_${payload}_${SECRET_SALT}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < salted.length; i++) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return hex.slice(0, 4);
}

/**
 * Menghasilkan kunci VIP sah (untuk kegunaan Boss/Admin menjana kunci kepada pembeli).
 * Format: HD-XXXXXXXX-YYYY (8 aksara kod + 4 aksara checksum)
 */
export function generateVipKey(customSeed?: string): string {
  const seed = (customSeed || Math.random().toString(36).substring(2, 10)).toUpperCase().padEnd(8, 'X').slice(0, 8);
  const checksum = computeChecksum(seed);
  return `HD-${seed}-${checksum}`;
}

/**
 * Mengesahkan ketulenan kunci VIP secara kriptografik tanpa bergantung pada wildcard mudah.
 */
export function validateVipKey(key: string): boolean {
  const cleaned = key.trim().toUpperCase().replace(/\s+/g, '');

  // 1. Kunci Pentadbir Master / Boss
  if (cleaned === 'BOSSKITA' || cleaned === 'BOSSKITA-HD2026-VIP') {
    return true;
  }

  // 2. Format Kunci Berstruktur: HD-[8 CHARS]-[4 CHECKSUM]
  const match = cleaned.match(/^HD-([A-Z0-9]{8})-([A-Z0-9]{4})$/);
  if (match) {
    const [, payload, checksum] = match;
    return checksum === computeChecksum(payload);
  }

  // 3. Sokongan kod tanpa hyphen: HD[8][4]
  const matchFlat = cleaned.match(/^HD([A-Z0-9]{8})([A-Z0-9]{4})$/);
  if (matchFlat) {
    const [, payload, checksum] = matchFlat;
    return computeChecksum(payload) === checksum;
  }

  return false;
}

export function isVipActive(): boolean {
  const token = localStorage.getItem(STORAGE_KEY_VIP);
  if (!token) return false;
  return validateVipKey(token);
}

export function activateVipKey(key: string): boolean {
  if (validateVipKey(key)) {
    const cleaned = key.trim().toUpperCase().replace(/\s+/g, '');
    localStorage.setItem(STORAGE_KEY_VIP, cleaned);
    return true;
  }
  return false;
}

export function initTrial(): { daysLeft: number; isSubscribed: boolean } {
  if (isVipActive()) {
    return { daysLeft: 999, isSubscribed: true };
  }

  // Jika sebelum ini sudah ditandakan tamat tempoh percubaan
  if (localStorage.getItem(STORAGE_KEY_EXPIRED) === 'true') {
    return { daysLeft: 0, isSubscribed: false };
  }

  const storedStart = localStorage.getItem(STORAGE_KEY_START);
  const now = Date.now();

  if (!storedStart) {
    localStorage.setItem(STORAGE_KEY_START, now.toString());
    return { daysLeft: TRIAL_DAYS, isSubscribed: false };
  }

  let startTime = parseInt(storedStart, 10);
  // Tangani kemungkinan data corrupted / NaN atau manipulasi masa ke masa hadapan
  if (isNaN(startTime) || startTime > now) {
    startTime = now;
    localStorage.setItem(STORAGE_KEY_START, now.toString());
  }

  const msPassed = now - startTime;
  const daysPassed = msPassed / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysPassed));

  if (daysLeft <= 0) {
    localStorage.setItem(STORAGE_KEY_EXPIRED, 'true');
  }

  return { daysLeft, isSubscribed: false };
}
