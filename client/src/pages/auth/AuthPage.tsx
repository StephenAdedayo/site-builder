// src/pages/auth/[path].tsx  (or however you name dynamic routes)
import { Auth } from "@/components/auth/auth"
import { useParams } from "react-router-dom"

export default function AuthPage() {
  const { path } = useParams()

  return (
    <div className="flex p-6 flex-col justify-center items-center h-[80vh]">
        <div className="bg-black/10 ring ring-indigo-900 rounded-xl">
    <Auth path={path} className="bg-"/>
  </div>

    </div>
  )
}