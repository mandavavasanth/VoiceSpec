const config = {
  '*.{ts,tsx,mts}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,css,yml,yaml}': ['prettier --write'],
};
export default config;
