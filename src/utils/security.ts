const GALLERY_PATTERNS = [
  /ImagePicker/i,
  /imagepicker/i,
  /DCIM/i,
  /gallery/i,
  /Photos\//i,
  /mock:\/\//i,
  /screenshot/i,
];

const MAX_CAPTURE_AGE_MS = 3 * 60 * 1000;

export const SecurityUtils = {
  async validateLiveCapture(mediaUri: string, capturedAt: string): Promise<boolean> {
    if (!mediaUri || !capturedAt) return false;

    for (const pattern of GALLERY_PATTERNS) {
      if (pattern.test(mediaUri)) return false;
    }

    const age = Date.now() - new Date(capturedAt).getTime();
    if (age < 0 || age > MAX_CAPTURE_AGE_MS) return false;

    return true;
  },

  validateCaptureTime(captureTimestamp: string, sessionStart: string, sessionEnd: string): boolean {
    const capture = new Date(captureTimestamp).getTime();
    const start = new Date(sessionStart).getTime();
    const end = new Date(sessionEnd).getTime();
    return capture >= start - 30_000 && capture <= end + 30_000;
  },

  validateSessionToken(token: string, activeSessionId: string): boolean {
    return token.startsWith(activeSessionId);
  },
};
