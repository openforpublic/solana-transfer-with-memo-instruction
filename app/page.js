import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Open For Public</h1>
        <p className="text-xl">Building tools for organizational transparency</p>
      </header>

      <main className="w-full max-w-3xl">
        <h2 className="text-2xl font-semibold mb-6">Our Tools</h2>
        <ul className="space-y-6">
          <ToolCard
            title="Solana Transaction with Memo"
            description="Create Solana transactions with custom memos for enhanced transparency."
            link="/transfer-memo-solana"
          />
          {/* Add more ToolCard components here as you build more tools */}
        </ul>
      </main>

      <footer className="mt-16 text-center text-sm text-gray-600">
        <p>&copy; 2024 Open For Public. All rights reserved.</p>
      </footer>
    </div>
  );
}

function ToolCard({ title, description, link }) {
  return (
    <li className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link href={link} className="text-blue-600 hover:underline">
        Try it out →
      </Link>
    </li>
  );
}
