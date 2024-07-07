import logo from "../assets/logo.svg";
import logoLight from "../assets/logoLight.svg";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-neutral-700/80">
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 text-black text-center text-sm py-1 font-medium">
        Join the Waitlist, Get a $5 Credit at Launch
      </div>
      <div className="text-sm mx-10 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            <img className="h-7 w-7" src={logoLight} alt="Spar Markets" />
            <span className="text-2xl tracking-tight font-medium">spar</span>
          </div>
          <div className="lg:flex justify-center space-x-2 items-center">
            <a href="#" className="py-2 px-3 border rounded-md">
              Contact
            </a>
            <a
              href="#"
              className="py-2 px-3 rounded-md bg-accent text-white hover:bg-accentSelect"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
