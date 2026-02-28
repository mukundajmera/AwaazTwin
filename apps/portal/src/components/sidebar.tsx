"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Voice Cloning", href: "/topics/voice-cloning", icon: "📘" },
  { label: "TTS", href: "/topics/tts", icon: "🔊" },
  { label: "Models", href: "/topics/models", icon: "🤖" },
  { label: "Guides", href: "/topics/guides", icon: "📖" },
  { label: "Reference", href: "/topics/reference", icon: "📋" },
];

const utilityLinks = [
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Test Console", href: "/tests", icon: "🧪" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 border-r border-gray-200 bg-gray-50 min-h-screen p-4 flex flex-col"
      data-testid="sidebar"
    >
      <div className="mb-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          🎙️ AwaazTwin
        </Link>
        <p className="text-xs text-gray-500 mt-1">Voice Cloning Portal</p>
      </div>

      <nav className="flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Content
        </p>
        <ul className="space-y-1 mb-6">
          {sections.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname.startsWith(section.href)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Tools
        </p>
        <ul className="space-y-1">
          {utilityLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 pt-4 text-xs text-gray-400">
        AwaazTwin v0.1 • CPU Mode
      </div>
    </aside>
  );
}
