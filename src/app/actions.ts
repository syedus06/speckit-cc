'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

interface Project {
  name: string;
  path: string;
}

// Default Gemini spec content
const defaultGeminiSpec = `
{
  "model": {
    "modelName": "gemini-1.5-pro-latest",
    "temperature": 0.9,
    "topK": 1,
    "topP": 1,
    "maxOutputTokens": 8192
  },
  "safety": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ],
  "preamble": ""
}
`;

async function readProjects(): Promise<Project[]> {
    const projectsFilePath = path.join(process.cwd(), 'projects.json');
    try {
        const fileContent = await fs.readFile(projectsFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeProjects(projects: Project[]): Promise<void> {
    const projectsFilePath = path.join(process.cwd(), 'projects.json');
    await fs.writeFile(projectsFilePath, JSON.stringify(projects, null, 2));
}

export async function addProject(prevState: any, formData: FormData) {
  const projectPath = formData.get('path') as string;

  if (!projectPath || projectPath.trim() === '') {
    return { message: 'Project path cannot be empty.', error: true };
  }

  try {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      return { message: 'The provided path is not a directory.', error: true };
    }

    await fs.access(path.join(projectPath, 'specify'));
    await fs.access(path.join(projectPath, 'specs'));

    const projects = await readProjects();
    if (projects.some(p => p.path === projectPath)) {
      return { message: 'This project has already been added.', error: true };
    }

    const newProject: Project = {
      name: path.basename(projectPath),
      path: projectPath,
    };
    await writeProjects([...projects, newProject]);

    revalidatePath('/dashboard');
    return { message: `Project "${newProject.name}" added successfully!`, error: false };

  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // This is the key change: prompt the user to initialize.
        return { 
            message: `Directory \"${path.basename(projectPath)}\" is not a spec-kit project. Would you like to initialize it?`, 
            requiresInit: true, 
            projectPath 
        };
    }
    console.error('Error adding project:', error);
    return { message: 'An unexpected error occurred.', error: true };
  }
}

export async function initializeProject(prevState: any, formData: FormData) {
    const projectPath = formData.get('path') as string;

    try {
        await fs.mkdir(path.join(projectPath, 'specify'));
        await fs.mkdir(path.join(projectPath, 'specs'));
        await fs.writeFile(path.join(projectPath, 'specify', 'gemini.spec'), defaultGeminiSpec);

        const projects = await readProjects();
        const newProject: Project = {
            name: path.basename(projectPath),
            path: projectPath,
        };
        await writeProjects([...projects, newProject]);

        revalidatePath('/dashboard');
        return { message: `Project "${newProject.name}" initialized and added successfully!`, error: false };

    } catch (error) {
        console.error('Error initializing project:', error);
        return { message: 'Failed to initialize project.', error: true };
    }
}

export async function getProjects(): Promise<Project[]> {
    return readProjects();
}

export async function getAgentsForProject(projectPath: string): Promise<string[]> {
    const specifyDir = path.join(projectPath, 'specify');
    try {
        const files = await fs.readdir(specifyDir);
        return files.filter(file => file.endsWith('.spec'));
    } catch (error) {
        console.error(`Error reading agents from ${specifyDir}:`, error);
        return [];
    }
}
