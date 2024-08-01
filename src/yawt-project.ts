export type YawtProject = {
  name: string;
  links?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  peerDependencies?: string[];
  publish?: boolean;
};
