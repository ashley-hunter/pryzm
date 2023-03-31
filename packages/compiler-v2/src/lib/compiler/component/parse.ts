import * as ts from 'typescript';
import {
  findGettersWithDecorator,
  findMethod,
  findMethods,
  findPropertiesWithDecorator,
  findSelector,
  findSlotNames,
  findStyles,
  findTemplate,
  Validators,
} from '../utils';
import { ComponentMetadata } from './model';

export function parseComponent(
  sourceFile: ts.SourceFile,
  component: ts.ClassDeclaration
): ComponentMetadata {
  return {
    path: sourceFile.fileName,
    name: component.name!.getText(),
    selector: findSelector(component),
    template: findTemplate(component),
    styles: findStyles(component),
    refs: findPropertiesWithDecorator(component, 'Ref', [Validators.readonly, Validators.private]),
    props: findPropertiesWithDecorator(component, 'Prop', [Validators.readonly, Validators.public]),
    computed: findGettersWithDecorator(component, 'Computed', [Validators.private]),
    context: findPropertiesWithDecorator(component, 'Inject', [
      Validators.readonly,
      Validators.private,
    ]),
    events: findPropertiesWithDecorator(component, 'Event', [
      Validators.readonly,
      Validators.public,
    ]),
    state: findPropertiesWithDecorator(component, 'State', [
      Validators.readonly,
      Validators.private,
    ]),
    methods: findMethods(component, {
      validators: [Validators.private],
      includeLifecycle: false,
      includeRender: false,
    }),
    onInit: findMethod(component, 'onInit', [Validators.private]),
    onDestroy: findMethod(component, 'onDestroy', [Validators.private]),
    providers: [],
    slots: findSlotNames(component),
  };
}
