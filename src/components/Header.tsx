import { Search } from "lucide-react";

const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search..." className="w-64 py-2 pl-10 pr-4 text-white bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
    </header>
  );
};

export default Header;
