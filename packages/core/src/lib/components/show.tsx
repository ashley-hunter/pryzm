import { JSX } from '../../jsx-runtime';

export interface ShowProps {
  when: boolean;
  fallback?: JSX.Element;
  children: JSX.Element | JSX.Element[];
}

export const Show = (props: ShowProps) => {
  // this is a compile time only component so we don't actually need to render anything
  return null;
};
