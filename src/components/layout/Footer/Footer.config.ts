import {
  SocialFacebook,
  SocialMail,
  SocialPhone,
} from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";

/** `icon` is a component, not an asset path — see components/ui/Icon/social. */
export const FOOTER_SOCIAL_ITEMS = [
  {
    key: "facebook",
    href: siteConfig.social.facebook,
    icon: SocialFacebook,
    external: true,
  },
  {
    key: "email",
    href: `mailto:${siteConfig.email}`,
    icon: SocialMail,
    external: false,
  },
  {
    key: "phone",
    href: siteConfig.phoneHref,
    icon: SocialPhone,
    external: false,
  },
] as const;
