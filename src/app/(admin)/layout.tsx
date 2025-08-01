import Header from "@/components/Header";
import {Sidebar} from "@/components/Sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
 async function   adminlayout( {children,
}: Readonly<{
  children: React.ReactNode;
}>) {
      const {userId}=await auth();
  
   
  if(!userId) return redirect("/login") ;
  return (
    <div className="flex flex-col flex-1">
    {/* Header*/ }
    
    <Header />

    <div className="flex flex-col  lg:flex-row bg-gray-100">
        {/*SIdebar*/}
         <Sidebar/>  
<div className="flex-1 flex justify-center lg:justify-center items-center  mx-auto w-full">

{children}
</div>

    </div>
    </div>
  )
}
export default adminlayout