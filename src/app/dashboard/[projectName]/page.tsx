'use client';

import { useEffect, useState } from 'react';
import { getProjects } from '@/app/actions';

interface Project {
  name: string;
  path: string;
}

// This is a placeholder for the action to get agent configs
async function getAgentsForProject(projectPath: string): Promise<string[]> {
    // In the next step, I will implement this to scan the project's directory
    console.log(`Scanning for agents in: ${projectPath}`);
    return ['gemini.spec', 'claude.spec', 'cursor.spec']; // Placeholder data
}

export default function ProjectDetailsPage({ params }: { params: { projectName: string } }) {
    const [project, setProject] = useState<Project | null>(null);
    const [agents, setAgents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProject() {
            const projects = await getProjects();
            const currentProject = projects.find(p => p.name === params.projectName);
            
            if (currentProject) {
                setProject(currentProject);
                const foundAgents = await getAgentsForProject(currentProject.path);
                setAgents(foundAgents);
            }            
            setLoading(false);
        }

        loadProject();
    }, [params.projectName]);

    if (loading) {
        return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
    }

    if (!project) {
        return <div className="min-h-screen bg-gray-900 text-white p-8">Project not found.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                <p className="text-gray-400 mb-8">{project.path}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <h2 className="text-2xl font-semibold mb-4">AI Agents</h2>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                            <ul>
                                {agents.map(agent => (
                                    <li key={agent} className="p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                        {agent}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        {/* The agent configuration editor will go here in a future step */}
                        <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
                         <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-64 flex items-center justify-center">
                            <p className="text-gray-500">Select an agent to view its configuration.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
