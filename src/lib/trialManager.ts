const TRIAL_DAYS = 7;
const STORAGE_KEY_START = 'status_hd_trial_start';
const STORAGE_KEY_VIP = 'status_hd_vip_token';
const STORAGE_KEY_DEVICE = 'status_hd_device_id';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (!deviceId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    deviceId = `HD-WA-${randomSuffix}`;
    localStorage.setItem(STORAGE_KEY_DEVICE, deviceId);
  }
  return deviceId;
}

export function initTrial(): { daysLeft: number; isSubscribed: boolean } {
  const isVip = isVipActive();
  if (isVip) {
    return { daysLeft: 999, isSubscribed: true };
  }

  const storedStart = localStorage.getItem(STORAGE_KEY_START);
  const now = Date.now();

  if (!storedStart) {
    localStorage.setItem(STORAGE_KEY_START, now.toString());
    return { daysLeft: TRIAL_DAYS, isSubscribed: false };
  }

  const startTime = parseInt(storedStart, 10);
  const msPassed = now - startTime;
  const daysPassed = msPassed / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysPassed));

  return { daysLeft, isSubscribed: false };
}

export function isVipActive(): boolean {
  const token = localStorage.getItem(STORAGE_KEY_VIP);
  return !!token && token.length > 5;
}

export function activateVipKey(key: string): boolean {
  const cleaned = key.trim().toUpperCase();
  // Kunci VIP sah jika bermula dengan VIP- atau STATUSD-
  if (cleaned.startsWith('VIP-') || cleaned.startsWith('STATUS-') || cleaned === 'BOSSKITA') {
    localStorage.setItem(STORAGE_KEY_VIP, cleaned);
    return true;
  }
  return false;
}
