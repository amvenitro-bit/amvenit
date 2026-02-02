import clsx from "clsx";
import { ctaDetails } from "@/data/cta";

const AppStoreButton = ({ dark }: { dark?: boolean }) => {
  return (
    <a href={ctaDetails.appStoreUrl}>
      <button
        type="button"
        className={clsx(
          // MOBILE: mai mic + incape 2 pe rand
          // SM+: revine mai mare
          "flex items-center justify-center rounded-full h-12 sm:h-14 " +
            "min-w-[150px] sm:min-w-[205px] " +
            "px-4 sm:px-6 " +
            "w-auto",
          {
            "text-white bg-foreground": dark,
            "text-foreground bg-white": !dark,
          }
        )}
      >
        <div className="mr-2 sm:mr-3">
          <svg viewBox="0 0 384 512" className="w-5 sm:w-7" aria-hidden="true">
            <path
              fill="currentColor"
              d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
            />
          </svg>
        </div>

        <div className="text-left leading-tight">
          <div className="text-[10px] sm:text-xs opacity-90">Download on the</div>
          <div className="-mt-0.5 font-sans text-base sm:text-xl font-semibold">
            App Store
          </div>
        </div>
      </button>
    </a>
  );
};

export default AppStoreButton;