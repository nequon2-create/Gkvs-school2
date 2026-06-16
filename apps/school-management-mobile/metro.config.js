const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the local project folder and the monorepo root node_modules
config.watchFolders = [
    projectRoot,
    path.resolve(monorepoRoot, 'node_modules')
];

// Resolve modules from the local project first, then monorepo root
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure the main App is resolved correctly
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
