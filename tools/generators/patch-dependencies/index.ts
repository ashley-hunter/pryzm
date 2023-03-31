import { Tree } from '@nrwl/devkit';

export default async function (tree: Tree) {
  let tsquery = tree.read('node_modules/@phenomnomnominal/tsquery/dist/src/parse.js', 'utf-8');

  tsquery = tsquery!.replace(
    'esquery.parse(cleanSelector)',
    '(esquery.parse || esquery.default.parse)(cleanSelector)'
  );

  tree.write('node_modules/@phenomnomnominal/tsquery/dist/src/parse.js', tsquery!);
}
