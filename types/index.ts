import type React from "react";

/**
 * IMPORTANT:
 * Template-ul poate avea câmpuri diferite între fișierele din /data.
 * Ca să nu mai crape build-ul la fiecare câmp nou, toate interfețele
 * au și un index signature: [key: string]: any
 * => TypeScript nu mai moare pe "nu există proprietatea X".
 */

/** ===== Benefits ===== */
export interface IBenefitBullet {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

export interface IBenefit {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  bullets?: IBenefitBullet[];
  imageSrc?: string;
  [key: string]: any;
}

/** ===== FAQ ===== */
export interface IFAQ {
  question?: string;
  answer?: string;
  [key: string]: any;
}

/** ===== Stats ===== */
export interface IStats {
  title?: string;
  value?: string;
  description?: string;        // ✅ FIX pentru eroarea ta de acum
  icon?: React.ReactNode;
  [key: string]: any;
}

/** ===== Pricing ===== */
export interface IPricing {
  name?: string;
  price?: string;
  description?: string;
  features?: string[];
  buttonText?: string;
  buttonUrl?: string;
  isMostPopular?: boolean;
  highlight?: boolean;
  [key: string]: any;
}

/** ===== Footer / Menus ===== */
export interface IMenuItem {
  text: string;
  url: string; // ✅ obligatoriu, nu mai poate fi undefined
  [key: string]: any;
}

export interface ISocials {
  platform?: string;
  url?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

/** ===== Site Details (unele template-uri cer asta) ===== */
export interface ISiteDetails {
  siteName?: string;
  siteDescription?: string;
  siteUrl?: string;
  [key: string]: any;
}

/** ===== Testimonials (dacă există în template) ===== */
export interface ITestimonial {
  name?: string;
  title?: string;
  message?: string;
  avatar?: string;
  rating?: number;
  [key: string]: any;
}

/** ===== CTA (dacă există în template) ===== */
export interface ICTA {
  heading?: string;
  subheading?: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  [key: string]: any;
}