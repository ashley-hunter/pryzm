import { JSX } from '../../jsx-runtime';

export interface Renderable {
  render(): JSX.Element;
}
