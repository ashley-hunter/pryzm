export function Navbar({
  framework,
  setFramework,
}: {
  framework: string;
  setFramework: (framework: string) => void;
}) {
  return (
    <nav className="bg-white border-b">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <img className="h-3.5" src="/logo.svg" alt="Logo" />
            <small className="text-xs font-medium text-gray-400 pl-1 mt-1.5">v0.1</small>

            <select
              className="ml-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
              value={framework}
              onChange={event => setFramework(event.target.value as string)}
            >
              <option value="react">React</option>
              <option value="svelte">Svelte</option>
              <option value="vue">Vue</option>
              <option value="lit">Lit</option>
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}
