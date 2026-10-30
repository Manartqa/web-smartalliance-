/**
 * ISO certificates shown on the home page. Keys resolve against
 * `home.certifications.items.*` in `messages/*.json`; everything else is copied
 * from the certificate itself and is the same in every locale.
 *
 * `validUntil` is the date the certificate stops being valid without renewal —
 * "Certificate Expiry" on the certificate. Replace the PDF, thumbnail and these
 * fields together when a certificate is renewed.
 */
export const CERTIFICATIONS = [
  {
    key: "iso29110",
    standard: "ISO/IEC 29110-4-1:2018",
    // The standard's official title — English on the certificate and on the
    // card in every locale.
    name: "Systems and software engineering — Lifecycle profiles for Very Small Entities (VSEs)",
    certificateNo: "28112401",
    issuer: "Otabu Global Services Pvt. Ltd.",
    validUntil: "2027-11-27",
    pdf: "/certificates/iso-29110-smart-alliance.pdf",
    thumbnail: "/assets/cert-iso-29110.webp",
  },
] as const;
