/**
 * Where students reach MedADN: payment receipts (BaridiMob), activation codes and
 * password resets all go through these social accounts. The landing footer links them
 * too, along with the YouTube channel.
 */
export const INSTAGRAM_URL = 'https://www.instagram.com/med.adn.dz/';
export const INSTAGRAM_HANDLE = '@med.adn.dz';
export const FACEBOOK_URL = 'https://www.facebook.com/medadn';
export const YOUTUBE_URL = 'https://www.youtube.com/@medadndz';

/**
 * Password reset by e-mailed code. The API has no e-mail provider yet and answers
 * /auth/forgot-password with 503 outside development, so /forgot-password and
 * /reset-password ask students to contact MedADN instead (an admin resets the
 * password from the Users table). Build with NEXT_PUBLIC_PASSWORD_RESET_ENABLED=true
 * to bring the e-mailed code forms back once e-mail works.
 */
export const PASSWORD_RESET_BY_EMAIL_ENABLED = process.env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED === 'true';
