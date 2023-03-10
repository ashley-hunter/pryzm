import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { exampleFiles } from '../examples/examples';
import { FrameworkPicker } from './framework-picker';

interface NavbarProps {
  framework: string;
  onFrameworkChange: (framework: string) => void;
  onExampleChange: (example: string) => void;
}

export function Navbar({ framework, onFrameworkChange, onExampleChange }: NavbarProps) {
  const examples = Object.keys(exampleFiles);

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto px-2 sm:px-6 lg:px-4">
        <div className="relative flex h-16 items-center">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="mr-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white outline-none hover:bg-gray-100">
                <HamburgerMenuIcon />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content className="ml-2 min-w-[220px] rounded-md border bg-white p-1 shadow-lg">
                {/* Small Header with the title Examples */}
                <span className="block px-4 py-2 text-xs font-medium uppercase text-gray-500">
                  Examples
                </span>

                {examples.map(example => (
                  <DropdownMenu.Item
                    key={example}
                    className="flex cursor-pointer select-none items-center rounded px-4 py-2 text-sm capitalize outline-none transition-colors hover:bg-gray-100"
                    onClick={() => {
                      onExampleChange(exampleFiles[example]);
                    }}
                  >
                    {example}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <img className="h-3.5" src="/logo.svg" alt="Logo" />
            <small className="mt-1.5 pl-2 text-xs font-medium tracking-wider text-gray-400">
              v0.1
            </small>
          </div>
          <div className="flex-1" />

          <FrameworkPicker framework={framework} onFrameworkChange={onFrameworkChange} />
        </div>
      </div>
    </nav>
  );
}
