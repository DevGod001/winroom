/** Default delivery address for /api/contact when CONTACT_TO_EMAIL is unset (same inbox as Gmail base). */
export const CONTACT_INBOX = "winroomderiv+inbox@gmail.com";

/** Public-facing mailbox label (for UI copy); plus-alias above delivers to this inbox too. */
export const CONTACT_BRAND_EMAIL = "winroomderiv@gmail.com";

export function getContactToEmail(): string {
  const o = process.env.CONTACT_TO_EMAIL?.trim();
  return o || CONTACT_INBOX;
}
