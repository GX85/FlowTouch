export const appBase = import.meta.env.BASE_URL;
export const appUrl = path => appBase + path.replace(/^\/+/, '');
