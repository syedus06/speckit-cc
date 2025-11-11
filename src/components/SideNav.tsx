import Link from "next/link";
import { GanttChart, ChevronRight, Settings, Code, BotMessageSquare, PencilRuler, ClipboardCheck, Terminal } from "lucide-react";

const SideNav = () => {
  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto border-r rtl:border-r-0 rtl:border-l bg-gray-900 border-gray-700">
      <Link href="/" className="flex items-center gap-2">
        <GanttChart className="w-8 h-8 text-white" />
        <h1 className="text-2xl font-bold text-white">SKCC</h1>
      </Link>

      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                <div className="flex items-center gap-2">
                    <BotMessageSquare className="w-5 h-5" />
                    <span>Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </li>
            <li>
              <Link href="/projects" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                <div className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    <span>Projects</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </li>
            <li>
              <Link href="/constitution" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                <div className="flex items-center gap-2">
                    <PencilRuler className="w-5 h-5" />
                    <span>Constitution</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </li>
            <li>
              <Link href="/specify" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    <span>Specify</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </li>
            <li>
                <Link href="/plan" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <GanttChart className="w-5 h-5" />
                        <span>Plan</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </li>
            <li>
                <Link href="/tasks" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5" />
                        <span>Tasks</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </li>
            <li>
                <Link href="/implement" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5" />
                        <span>Implement</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto">
            <Link href="/settings" className="flex items-center justify-between px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </div>
                <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
