import { FrameworkPicker } from './framework-picker';

interface NavbarProps {
  framework: string;
  onFrameworkChange: (framework: string) => void;
}

export function Navbar({ framework, onFrameworkChange }: NavbarProps) {
  return (
    <nav className="bg-white border-b">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <img className="h-3.5" src="/logo.svg" alt="Logo" />
            <small className="text-xs font-medium text-gray-400 pl-1 mt-1.5">v0.1</small>
          </div>
          <div className="flex-1" />

          <FrameworkPicker framework={framework} onFrameworkChange={onFrameworkChange} />
        </div>
      </div>
    </nav>
  );
}
