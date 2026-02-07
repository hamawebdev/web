/**
 * Device fingerprint generation utility for single-device session enforcement.
 * Generates a consistent fingerprint based on browser/device characteristics.
 */

export function generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server';

    try {
        const components = [
            navigator.userAgent || '',
            navigator.language || '',
            screen.width + 'x' + screen.height,
            screen.colorDepth || 0,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 0,
            // Platform info
            navigator.platform || '',
        ];

        // Simple hash function to create a fingerprint
        const fingerprint = components.join('|');
        const hash = fingerprint.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        return Math.abs(hash).toString(36);
    } catch (error) {
        // Fallback if any property access fails
        console.warn('Device fingerprint generation failed, using fallback');
        return 'unknown';
    }
}

/**
 * Get stored device fingerprint or generate a new one
 */
export function getOrCreateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server';

    const FINGERPRINT_KEY = 'device_fingerprint';
    let fingerprint = localStorage.getItem(FINGERPRINT_KEY);

    if (!fingerprint) {
        fingerprint = generateDeviceFingerprint();
        localStorage.setItem(FINGERPRINT_KEY, fingerprint);
    }

    return fingerprint;
}
