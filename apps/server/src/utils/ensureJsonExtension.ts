export const ensureJsonExtension = (filename: string) => {
    return filename.includes('.json') ? filename : `${filename}.json`;
};
