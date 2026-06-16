import { Link } from "react-router-dom";
import AccountMenu from "./AccountMenu";

const Header = () => {
  return (
    <header className="w-full bg-header text-header-foreground py-4 px-8 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white">TMS</div>
          <span className="font-bold text-xl tracking-wider text-white">TOURNAMENT</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link to="/" className="text-accent border-b-2 border-accent pb-1">Trang chu</Link>
          <Link to="/tournaments" className="text-header-foreground hover:text-accent transition-colors">Giai dau</Link>
          <Link to="/about" className="text-header-foreground hover:text-accent transition-colors">Ve chung toi</Link>
          <Link to="/contact" className="text-header-foreground hover:text-accent transition-colors">Lien he</Link>
        </nav>
      </div>
      <AccountMenu dark />
    </header>
  );
};

export default Header;
