import Button from "@/components/Button";
import Image from 'next/image';

const SettingsPage = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-md">
                <h3 className="text-lg font-bold text-white mb-4">Account</h3>
                <div className="flex items-center gap-4 mb-6">
                    <Image src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" width={64} height={64} className="rounded-full" />
                    <div>
                        <p className="font-bold text-white">John Doe</p>
                        <p className="text-gray-400">john.doe@example.com</p>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-4">Theme</h3>
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline">Light</Button>
                    <Button>Dark</Button>
                </div>

                <h3 className="text-lg font-bold text-white mb-4">API Keys</h3>
                <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-md">
                    <div>
                        <p className="font-bold text-white">OpenAI API Key</p>
                        <p className="text-gray-400">••••••••••••••••••••••••••••••••••••</p>
                    </div>
                    <Button variant="destructive">Revoke</Button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
