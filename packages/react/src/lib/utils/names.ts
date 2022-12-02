export function setterName(getterName: string): string {
  return `set${getterName[0].toUpperCase()}${getterName.slice(1)}`;
}
