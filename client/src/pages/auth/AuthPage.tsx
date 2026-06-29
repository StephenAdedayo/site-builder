// src/pages/auth/[path].tsx  (or however you name dynamic routes)
import { Auth } from "@/components/auth/auth"
import { useParams } from "react-router-dom"

export default function AuthPage() {
  const { path } = useParams()

  return (
    <div className="flex p-6 flex-col justify-center relative items-center h-screen">
        <div className=" ring ring-indigo-900 rounded-xl">
    <Auth path={path} className="bg-black/10"/>
     <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/hero/bg-gradient-2.png" className="absolute inset-0 -z-10 size-full opacity" alt="" />
  </div>

    </div>
  )
}