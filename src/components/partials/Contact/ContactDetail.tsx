import { useTranslations } from "next-intl";

import { BaseSectionLabel } from "@/components/ui/SectionLabel";

import ContactForm from "./ContactForm";
import ContactInfo from "./ContactInfo";

/**
 * Two-column body of the contact page: the form on the left, the company's
 * contact details on the right. Only `ContactForm` crosses into the client.
 */
export default function ContactDetail() {
  const t = useTranslations("contact");

  return (
    <section className="container-site pt-8 pb-14 lg:pt-16 lg:pb-10">
      <div className="grid gap-14 lg:grid-cols-[1fr_420px] lg:gap-20">
        <div>
          <BaseSectionLabel>{t("formLabel")}</BaseSectionLabel>
          <h2 className="mt-4 max-w-lg text-2xl font-semibold leading-snug text-navy lg:text-[2rem]">
            {t("formHeading")}
          </h2>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>

        <div>
          <BaseSectionLabel>{t("touchLabel")}</BaseSectionLabel>
          <h2 className="mt-4 text-2xl font-semibold leading-snug text-navy lg:text-[2rem]">
            {t("touchHeading")}
          </h2>
          <div className="mt-8">
            <ContactInfo />
          </div>
        </div>
      </div>
    </section>
  );
}
