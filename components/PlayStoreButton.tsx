import React from "react";
import clsx from "clsx";
import { ctaDetails } from "@/data/cta";

const PlayStoreButton = ({ dark }: { dark?: boolean }) => {
  const base =
    "flex items-center justify-center min-w-[205px] mt-3 px-6 h-14 rounded-full w-full sm:w-fit transition shadow-lg";

  const classes = clsx(
    base,
    dark
      ? "bg-white text-black hover:bg-gray-100"
      : "bg-[#0b1020] text-white hover:bg-[#111c33]"
  );

  return (
    <a href={ctaDetails.googlePlayUrl} target="_blank" rel="noreferrer">
      <button type="button" className={classes}>
        <div className="mr-3">
          <svg viewBox="30 336.7 120.9 129.2" width="30" aria-hidden="true">
            <path
              fill="#FFD400"
              d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"
            />
            <path
              fill="#FF3333"
              d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z"
            />
            <path
              fill="#48FF48"
              d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"
            />
            <path
              fill="#3BCCFF"
              d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"
            />
          </svg>
        </div>
        <div className="leading-tight text-left">
          <div className="text-xs uppercase tracking-wide">Get it on</div>
          <div className="-mt-1 font-sans text-xl font-semibold">Google Play</div>
        </div>
      </button>
    </a>
  );
};

export default PlayStoreButton;