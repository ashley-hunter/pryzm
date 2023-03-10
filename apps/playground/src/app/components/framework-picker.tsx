import * as ToggleGroup from '@radix-ui/react-toggle-group';
import clsx from 'clsx';

interface FrameworkPickerProps {
  framework: string;
  onFrameworkChange: (framework: string) => void;
}

export function FrameworkPicker({ framework, onFrameworkChange }: FrameworkPickerProps) {
  const frameworks = ['react', 'svelte', 'vue', 'lit'];

  return (
    <ToggleGroup.Root
      className="flex space-x-1 rounded-lg bg-gray-100 p-0.5"
      type="single"
      value={framework}
      onValueChange={onFrameworkChange}
    >
      {frameworks.map(lib => (
        <ToggleGroup.Item asChild key={lib} value={lib}>
          <button
            className={clsx(
              'flex min-w-[48px] items-center justify-center rounded-md py-[0.4375rem] px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2',
              {
                'bg-white shadow': lib === framework,
                'hover:bg-gray-200': lib !== framework,
              }
            )}
            type="button"
          >
            <span
              className={clsx('capitalize', {
                'text-gray-600': lib !== framework,
                'text-gray-900': lib === framework,
              })}
            >
              {lib}
            </span>
          </button>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
