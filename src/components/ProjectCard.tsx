import { Star } from "lucide-react";

interface ProjectCardProps {
    name: string;
    repository: string;
    stars: number;
    lastUpdate: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ name, repository, stars, lastUpdate }) => {
  return (
    <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
        <h3 className="text-lg font-bold text-white mb-2">{name}</h3>
        <p className="text-sm text-gray-400 mb-4">{repository}</p>
        <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{stars}</span>
            </div>
            <span>{lastUpdate}</span>
        </div>
    </div>
  );
};

export default ProjectCard;
