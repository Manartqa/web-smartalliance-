/**
 * ISO certificates shown on the home page. Keys resolve against
 * `home.certifications.items.*` in `messages/*.json`; everything else is copied
 * from the certificate itself and is the same in every locale.
 *
 * `validUntil` is the date the certificate stops being valid without renewal —
 * "Recertification Due" on the ISO 9001 certificate, "Certificate Expiry" on
 * the ISO/IEC 29110 one. Replace the PDF, thumbnail and these fields together
 * when a certificate is renewed.
 */
export const CERTIFICATIONS = [
  {
    key: "iso9001",
    standard: "ISO 9001:2015",
    // The standard's official title — English on the certificate and on the
    // card in every locale.
    name: "Quality Management System",
    certificateNo: "0905Q394926",
    issuer: "Ostia Management Pvt. Ltd.",
    validUntil: "2029-09-04",
    pdf: "/certificates/iso-9001-smart-alliance.pdf",
    downloadName: "ISO-9001-Smart-Alliance.pdf",
    thumbnail: "/assets/cert-iso-9001.webp",
  },
  {
    key: "iso29110",
    standard: "ISO/IEC 29110-4-1:2018",
    name: "Systems and software engineering — Lifecycle profiles for Very Small Entities (VSEs)",
    certificateNo: "28112401",
    issuer: "Otabu Global Services Pvt. Ltd.",
    validUntil: "2027-11-27",
    pdf: "/certificates/iso-29110-smart-alliance.pdf",
    downloadName: "ISO-IEC-29110-Smart-Alliance.pdf",
    thumbnail: "/assets/cert-iso-29110.webp",
  },
] as const;
