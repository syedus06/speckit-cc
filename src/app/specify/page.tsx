import { ClipboardCheck } from "lucide-react";
import Button from "@/components/Button";

const Specify = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Specify</h2>
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white">/speckit.specify</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="what-why" className="block text-sm font-medium text-gray-300 mb-2">What/Why Description</label>
            <textarea id="what-why" className="w-full h-96 p-4 text-white bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the feature you want to build..."></textarea>
          </div>
          <div className="bg-gray-900 p-4 border border-gray-700 rounded-md">
            <h4 className="text-lg font-bold text-white mb-4">Generated Specification</h4>
            <div className="prose prose-invert max-w-none">
              <p>The system shall allow users to upload profile pictures.</p>
              <p>The system shall display the user&apos;s profile picture in the header.</p>
              <p>The user&apos;s profile picture shall be stored in a secure cloud storage bucket.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button>Run /speckit.specify</Button>
        </div>
      </div>
    </div>
  );
};

export default Specify;
