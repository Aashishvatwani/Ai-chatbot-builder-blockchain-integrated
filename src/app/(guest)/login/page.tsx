import Avatar from "@/components/Avatar";
import { SignIn } from "@clerk/nextjs";

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#64B5F5] px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-4xl">
        {/* Left Side */}
        <div className="flex flex-col items-center justify-center bg-[#64B5F5] text-white p-8 space-y-6">
          <div className="bg-white rounded-full p-4 shadow-lg">
            <Avatar seed="PAPAFAM support Agent" className="w-48 h-48 md:w-60 md:h-60" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold">CUSTO-ASSIST</h1>
            <h2 className="text-base md:text-lg font-light mt-2">
              Your Customizable AI Chat Agent
            </h2>
            <h3 className="mt-6 text-lg font-semibold">Sign in to get started</h3>
          </div>
        </div>

        {/* Right Side - Clerk SignIn */}
        <div className="flex items-center justify-center p-8">
          <SignIn routing="hash" fallbackRedirectUrl="/" />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
