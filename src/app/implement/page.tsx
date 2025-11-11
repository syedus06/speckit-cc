import { Terminal } from "lucide-react";

const Implement = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Implement</h2>
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white">/speckit.implement</h3>
        </div>
        <div className="bg-black text-white font-mono text-sm p-4 rounded-md h-96 overflow-y-scroll">
          <p><span className="text-green-400">$</span> /speckit.implement --task=auth</p>
          <p>Running task: Implement user authentication...</p>
          <p>...</p>
          <p>...</p>
          <p>Task completed successfully!</p>
        </div>
      </div>
    </div>
  );
};

export default Implement;