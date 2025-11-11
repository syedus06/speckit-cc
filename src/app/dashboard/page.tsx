'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { addProject, getProjects, initializeProject } from '@/app/actions';
import Button from '@/components/Button';

interface Project {
  name: string;
  path: string;
}

const initialAddState = {
    message: '',
    error: false,
    requiresInit: false,
    projectPath: '',
};

const initialInitState = {
    message: '',
    error: false,
};

export default function Dashboard() {
    const [addState, addFormAction] = useActionState(addProject, initialAddState);
    const [initState, initFormAction] = useActionState(initializeProject, initialInitState);
    const [projects, setProjects] = useState<Project[]>([]);

    // Ref to reset the add form input
    const addFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        async function fetchProjects() {
            const fetchedProjects = await getProjects();
            setProjects(fetchedProjects);
        }
        fetchProjects();

        // If a project was added or initialized successfully, refetch.
        if ((addState.message && !addState.error) || (initState.message && !initState.error)) {
             fetchProjects();
        }

        // Clear the form input after successful submission
        if (addState.message && !addState.error && !addState.requiresInit) {
            addFormRef.current?.reset();
        }

    }, [addState, initState]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Project</h2>
                    <form action={addFormAction} ref={addFormRef}>
                        <div className="flex items-center">
                            <input 
                                type="text" 
                                name="path"
                                placeholder="Enter absolute path to your project directory" 
                                className="flex-grow p-2 rounded-l-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={addState.requiresInit} // Disable if waiting for init confirmation
                            />
                            <Button type="submit" size="md" className="rounded-l-none" disabled={addState.requiresInit}>Add Project</Button>
                        </div>
                    </form>

                    {/* Standard success/error message for addProject */}
                    {addState.message && !addState.requiresInit && (
                        <p className={`mt-4 text-sm ${addState.error ? 'text-red-400' : 'text-green-400'}`}>
                            {addState.message}
                        </p>
                    )}

                    {/* Initialization confirmation prompt */}
                    {addState.requiresInit && (
                         <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                            <p className="text-yellow-300 text-sm mb-4">{addState.message}</p>
                            <form action={initFormAction}>
                                <input type="hidden" name="path" value={addState.projectPath} />
                                <Button type="submit" variant='primary' size='sm'>Initialize Project</Button>
                            </form>
                        </div>
                    )}

                    {/* Message for the result of initializeProject */}
                     {initState.message && (
                        <p className={`mt-4 text-sm ${initState.error ? 'text-red-400' : 'text-green-400'}`}>
                            {initState.message}
                        </p>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link href={`/dashboard/${encodeURIComponent(project.name)}`} key={project.path}>
                                <div className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer h-full hover:bg-gray-700 transition-colors">
                                    <h3 className="font-bold text-lg">{project.name}</h3>
                                    <p className="text-sm text-gray-400">{project.path}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {projects.length === 0 && !initState.message && !addState.message && (
                        <p className='text-gray-500'>You haven't added any projects yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
