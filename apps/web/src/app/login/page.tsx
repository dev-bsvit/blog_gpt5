"use client";
import AuthButton from "@/components/AuthButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Вход</h1>
        <p className="text-gray-500">Авторизуйтесь через Google, чтобы публиковать статьи</p>
        <div className="flex justify-center">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}



