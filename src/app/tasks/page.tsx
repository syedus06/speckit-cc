import { ClipboardCheck } from "lucide-react";
import Button from "@/components/Button";

const tasks = [
    { name: 'Implement user authentication', status: 'Completed', command: '/speckit.implement --task=auth' },
    { name: 'Design the database schema', status: 'In Progress', command: '/speckit.implement --task=db' },
    { name: 'Create the project dashboard', status: 'Todo', command: '/speckit.implement --task=dashboard' },
];

const Tasks = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Tasks</h2>
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">tasks.md</h3>
            </div>
            <Button>Generate Tasks</Button>
        </div>
        <table className="w-full text-left text-white">
          <thead>
            <tr>
              <th className="p-2"></th>
              <th className="p-2">Task</th>
              <th className="p-2">Status</th>
              <th className="p-2">Command</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={index} className="border-t border-gray-700 hover:bg-gray-700">
                <td className="p-2"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" /></td>
                <td className="p-2">{task.name}</td>
                <td className="p-2"><span className={`px-2 py-1 text-xs font-bold rounded-full ${task.status === 'Completed' ? 'bg-green-500 text-green-900' : task.status === 'In Progress' ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-500 text-gray-900'}`}>{task.status}</span></td>
                <td className="p-2 font-mono">{task.command}</td>
                <td className="p-2"><Button size="sm" variant="outline">Run</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tasks;
