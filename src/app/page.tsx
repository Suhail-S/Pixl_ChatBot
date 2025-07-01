import { ChatBot } from "@/components/ChatBot";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-zinc-900 dark:via-blue-950 dark:to-blue-900 items-center justify-center">
      <ChatBot />
    </main>
  );
}
