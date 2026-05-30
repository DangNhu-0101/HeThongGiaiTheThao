import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 w-full flex flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}