import React from "react";

const HeroSection = () => {
  return (
    <div className="flex flex-col mt-20 animate-fade-in-top">
      <h1 className="text-4xl sm:text-6xl lg:text-7xl text-left tracking-wide font-semibold">
        <span className="bg-gradient-to-r from-[#000] to-[#1abeab] text-transparent bg-clip-text animate-gradient-flow">
          A New Trading Ecoystem
        </span>
      </h1>
      <h1 className="text-4xl sm:text-6xl lg:text-7xl text-left tracking-wide font-semibold">
        <span className="bg-gradient-to-r from-[#000] to-[#1abeab] text-transparent bg-clip-text animate-gradient-flow">
          Wager. Compete. Earn.
        </span>
      </h1>
      <p className="mt-10 text-lg text-left text-neutral-500 max-w-4xl">
        Join free or pay-to-enter matches, actively manage simulated portfolios
        of stocks, options, and crypto, and achieve the highest return to win.
      </p>
      <div className="flex mt-10 justify-end w-full max-w-4xl shadow-lg border rounded-xl border-neutral-300">
        <input
          type="text"
          className="p-3 flex-grow rounded-xl focus:outline-none"
          placeholder="Enter your email"
        />
        <button className="p-3 px-10 m-2 bg-accent text-white rounded-lg hover:bg-accentSelect">
          <span className="font-bold lg:text-lg sm:text-md">Join Waitlist</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
