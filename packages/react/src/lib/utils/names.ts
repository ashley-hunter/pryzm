export function setterName(getterName: string): string {
  return `set${getterName[0].toUpperCase()}${getterName.slice(1)}`;
}

export function eventName(name: string): string {
  if (name.startsWith('on')) {
    return name;
  }

  return `on${name[0].toUpperCase()}${name.slice(1)}`;
}
