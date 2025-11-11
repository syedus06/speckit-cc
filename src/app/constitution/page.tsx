import { FileText } from "lucide-react";
import Button from "@/components/Button";

const Constitution = () => {
  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-6">Constitution</h2>
        <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">/speckit.constitution</h3>
            </div>
            <textarea className="w-full h-64 p-4 text-white bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your constitution prompt here..."></textarea>
            <div className="flex justify-end mt-4">
                <Button>Run Constitution</Button>
            </div>
        </div>
    </div>
  );
};

export default Constitution;
