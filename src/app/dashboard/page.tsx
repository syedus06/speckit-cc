'use client';

import { useActionState, useEffect, useState } from 'react';
import { addProject, getProjects } from '@/app/actions';
import Button from '@/components/Button';

interface Project {
  name: string;
  path: string;
}

const initialState = {
    message: '',
    error: false,
};

export default function Dashboard() {
    const [state, formAction] = useActionState(addProject, initialState);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        async function fetchProjects() {
            const fetchedProjects = await getProjects();
            setProjects(fetchedProjects);
        }
        fetchProjects();
    }, [state]); // Refetch projects when a new one is added

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Project</h2>
                    <form action={formAction}>
                        <div className="flex items-center">
                            <input 
                                type="text" 
                                name="path"
                                placeholder="Enter absolute path to your spec-kit project" 
                                className="flex-grow p-2 rounded-l-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button type="submit" size="md" className="rounded-l-none">Add Project</Button>
                        </div>
                    </form>
                    {state.message && (
                        <p className={`mt-4 text-sm ${state.error ? 'text-red-400' : 'text-green-400'}`}>
                            {state.message}
                        </p>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div key={project.path} className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-colors">
                                <h3 className="font-bold text-lg">{project.name}</h3>
                                <p className="text-sm text-gray-400">{project.path}</p>
                            </div>
                        ))}
                    </div>
                    {projects.length === 0 && (
                        <p className='text-gray-500'>You haven't added any projects yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
