'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

interface Project {
  name: string;
  path: string;
}

export async function addProject(prevState: any, formData: FormData) {
  const projectPath = formData.get('path') as string;

  if (!projectPath || projectPath.trim() === '') {
    return { message: 'Project path cannot be empty.', error: true };
  }

  try {
    // Check if path is a directory
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      return { message: 'The provided path is not a directory.', error: true };
    }

    // Check for 'specify' and 'specs' directories
    await fs.access(path.join(projectPath, 'specify'));
    await fs.access(path.join(projectPath, 'specs'));

    // Read existing projects
    const projectsFilePath = path.join(process.cwd(), 'projects.json');
    let projects: Project[] = [];
    try {
      const fileContent = await fs.readFile(projectsFilePath, 'utf-8');
      projects = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist, we'll create it.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    // Check for duplicates
    if (projects.some(p => p.path === projectPath)) {
      return { message: 'This project has already been added.', error: true };
    }

    // Add new project
    const newProject: Project = {
      name: path.basename(projectPath),
      path: projectPath,
    };
    projects.push(newProject);

    // Save updated projects file
    await fs.writeFile(projectsFilePath, JSON.stringify(projects, null, 2));

    revalidatePath('/dashboard');
    return { message: `Project "${newProject.name}" added successfully!`, error: false };

  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { message: 'The path does not exist or is not a valid spec-kit project (missing "specify" or "specs" folder).', error: true };
    }
    console.error('Error adding project:', error);
    return { message: 'An unexpected error occurred.', error: true };
  }
}

export async function getProjects(): Promise<Project[]> {
    const projectsFilePath = path.join(process.cwd(), 'projects.json');
    try {
        const fileContent = await fs.readFile(projectsFilePath, 'utf-8');
        const projects = JSON.parse(fileContent);
        return projects;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []; // No projects yet
        }
        throw error;
    }
}
