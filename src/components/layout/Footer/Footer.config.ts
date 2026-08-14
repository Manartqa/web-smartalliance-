import { siteConfig } from "@/config/site";

export const FOOTER_SOCIAL_ITEMS = [
  {
    key: "facebook",
    href: siteConfig.social.facebook,
    icon: "/assets/social-fb.png",
    external: true,
  },
  {
    key: "email",
    href: `mailto:${siteConfig.email}`,
    icon: "/assets/social-mail.png",
    external: false,
  },
  {
    key: "phone",
    href: siteConfig.phoneHref,
    icon: "/assets/social-phone.png",
    external: false,
  },
] as const;
