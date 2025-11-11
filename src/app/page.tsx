import Button from "@/components/Button";
import Link from "next/link";
import WebSocketClient from "@/components/WebSocketClient";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <div className="p-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to SpecKit Control Center</h1>
            <p className="text-lg text-gray-300 mb-8">Orchestrate and manage the entire Spec Kit and Specify CLI workflow.</p>
            <Link href="/dashboard">
                <Button size="lg">Get Started</Button>
            </Link>
        </div>
        <WebSocketClient />
    </div>
  );
};

export default Home;
