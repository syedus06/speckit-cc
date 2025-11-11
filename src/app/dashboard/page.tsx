import ProjectCard from '@/components/ProjectCard';

const projects = [
    {
        name: 'SpecKit Control Center',
        repository: 'github.com/seyo-studios/spec-kit-control-center',
        stars: 1200,
        lastUpdate: '2 hours ago',
    },
    {
        name: 'Online Learning Platform',
        repository: 'github.com/seyo-studios/online-learning-platform',
        stars: 850,
        lastUpdate: '4 hours ago',
    },
    {
        name: 'E-commerce Website',
        repository: 'github.com/seyo-studios/ecommerce-website',
        stars: 1500,
        lastUpdate: '1 day ago',
    },
];

const Dashboard = () => {
  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-6">Projects</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
                <ProjectCard key={index} {...project} />
            ))}
        </div>
    </div>
  );
};

export default Dashboard;
