import Link from "next/link";
export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 text-gray-800 flex flex-col items-center justify-center px-6 py-10 sm:px-20">
      
      {/* Header */}
      <header className="text-center mt-10">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight text-blue-600">
          Let&apos;s Build Together 🚀
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-xl">
          Join us in crafting innovative tools, one project at a time. Whether you&apos;re a developer, designer, or dreamer — you&apos;re in the right place.
        </p>
      </header>

      {/* Main Content / Illustration */}
      <main className="flex flex-col items-center justify-center gap-8 mt-16">
      
        <button className="mt-6 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-full text-lg font-medium shadow">
          <Link href="create-chatpod">Get Started</Link>
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 mt-20 mb-4">
        © {new Date().getFullYear()} Built with 💙 by YourTeamName
      </footer>
    </div>
  );
}
