import en from "../../../messages/en.json";
import th from "../../../messages/th.json";

import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/routing";

/**
 * next-intl resolves a missing key at render time, not at build time: the page
 * still ships, with the raw key where the copy should be. These tests are the
 * only thing standing between "someone added an English string" and that
 * appearing on the Thai site.
 */
type Messages = Record<string, unknown>;

const flatten = (value: Messages, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === "object"
      ? flatten(child as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const entries = (value: Messages, prefix = ""): Array<[string, string]> =>
  Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === "object"
      ? entries(child as Messages, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(child)] as [string, string]],
  );

const enKeys = flatten(en as Messages);
const thKeys = flatten(th as Messages);

/** `{year}`, `{count}` … — next-intl throws if a message uses one the caller does not pass. */
const placeholders = (message: string) =>
  [...message.matchAll(/\{(\w+)[^}]*\}/g)].map((match) => match[1]!).sort();

describe("message catalogues", () => {
  it("covers every locale the router declares", () => {
    // A third locale added to `routing.ts` without a catalogue would 500 on
    // every page under that prefix.
    expect(Object.keys({ en, th }).sort()).toEqual([...locales].sort());
  });

  it("has no key in English that is missing from Thai", () => {
    expect(enKeys.filter((key) => !thKeys.includes(key))).toEqual([]);
  });

  it("has no key in Thai that is missing from English", () => {
    // An orphan Thai key is dead weight, and usually the sign of a rename that
    // only landed on one side.
    expect(thKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it("has the same number of keys in both", () => {
    expect(thKeys.length).toBe(enKeys.length);
  });

  it("has no empty string in either catalogue", () => {
    const blanks = [...entries(en as Messages), ...entries(th as Messages)].filter(
      ([, value]) => value.trim() === "",
    );

    expect(blanks.map(([key]) => key)).toEqual([]);
  });

  it("uses the same placeholders in both languages for every message", () => {
    const enMap = new Map(entries(en as Messages));
    const mismatched = entries(th as Messages)
      .map(([key, thValue]) => ({
        key,
        en: placeholders(enMap.get(key) ?? ""),
        th: placeholders(thValue),
      }))
      .filter(({ en: a, th: b }) => a.join() !== b.join());

    expect(mismatched).toEqual([]);
  });

  it("leaves no Thai value identical to its English source in translated prose", () => {
    // Brand names and the like legitimately match; long prose that matches is
    // an untranslated string that shipped.
    const enMap = new Map(entries(en as Messages));
    const untranslated = entries(th as Messages)
      .filter(([key, value]) => enMap.get(key) === value && value.length > 60)
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });
});

describe("message catalogues — keys the code depends on", () => {
  it.each(["nav", "meta", "home", "about", "services", "contact", "cta", "footer", "notFound"])(
    "has the %s namespace in both locales",
    (namespace) => {
      expect(en).toHaveProperty(namespace);
      expect(th).toHaveProperty(namespace);
    },
  );

  it.each(["home", "about", "services", "contact"])(
    "has a title and description in meta.%s, which every page's <head> reads",
    (page) => {
      for (const catalogue of [en, th] as Messages[]) {
        const meta = (catalogue.meta as Messages)[page] as Messages;
        expect(meta?.title, `${page} title`).toBeTruthy();
        expect(meta?.description, `${page} description`).toBeTruthy();
      }
    },
  );

  it("has every error message the contact form can display", () => {
    const required = [
      "nameRequired",
      "emailRequired",
      "emailInvalid",
      "messageRequired",
      "tooMany",
    ];

    for (const catalogue of [en, th] as Messages[]) {
      const errors = ((catalogue.contact as Messages).form as Messages)
        .errors as Messages;
      for (const key of required) expect(errors, key).toHaveProperty(key);
    }
  });

  it("no longer interpolates a year into the footer copyright", () => {
    // The year was removed deliberately; passing `{year}` again would print a
    // date the client asked to drop.
    const copyright = (en.footer as Messages).copyright as string;

    expect(copyright).not.toContain("{year}");
    expect(placeholders(copyright)).toEqual([]);
  });
});
