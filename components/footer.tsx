import { Bus } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { ScrollToSection } from "./scroll-to-section";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-8 mt-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bus className="h-6 w-6 text-blue-300" />
              <span className="text-xl font-bold font-display">
                FamilyTransit
              </span>
            </div>
            <p className="text-blue-200 text-sm">
              Providing safe and reliable transportation services with a family
              touch since 1998.
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-blue-200 text-sm">
              &copy; {new Date().getFullYear()} FamilyTransit. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
