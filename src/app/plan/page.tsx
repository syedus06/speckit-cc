import { GanttChart } from "lucide-react";
import Button from "@/components/Button";

const Plan = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Plan</h2>
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
        <div className="flex items-center gap-2 mb-4">
          <GanttChart className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white">/speckit.plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Tech Stack</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input id="nextjs" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="nextjs" className="ml-2 text-sm font-medium text-gray-300">Next.js</label>
              </div>
              <div className="flex items-center">
                <input id="springboot" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="springboot" className="ml-2 text-sm font-medium text-gray-300">Spring Boot</label>
              </div>
              <div className="flex items-center">
                <input id="postgresql" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="postgresql" className="ml-2 text-sm font-medium text-gray-300">PostgreSQL</label>
              </div>
              <div className="flex items-center">
                <input id="react" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="react" className="ml-2 text-sm font-medium text-gray-300">React</label>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-lg font-bold text-white mb-4">Non-Functional Constraints</h4>
              <textarea className="w-full h-40 p-4 text-white bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Performance, Security, Cloud Provider"></textarea>
            </div>
          </div>
          <div className="bg-gray-900 p-4 border border-gray-700 rounded-md">
            <h4 className="text-lg font-bold text-white mb-4">Generated Plan</h4>
            <div className="prose prose-invert max-w-none">
              <p><strong>Architecture:</strong> The application will be a single-page application (SPA) built with Next.js and a Spring Boot backend.</p>
              <p><strong>Modules:</strong> The application will be divided into several modules, including authentication, user management, and project management.</p>
              <p><strong>Integrations:</strong> The application will integrate with GitHub for source control and Stripe for payments.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button>Run /speckit.plan</Button>
        </div>
      </div>
    </div>
  );
};

export default Plan;
