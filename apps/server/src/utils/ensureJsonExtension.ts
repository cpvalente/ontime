export const ensureJsonExtension = (filename: string) => {
    if (!filename) return filename;
    
    return filename.includes('.json') ? filename : `${filename}.json`;
};
