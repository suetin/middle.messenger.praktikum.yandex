export type QueryParams = Record<string, unknown>;

export const queryStringify = (data: QueryParams): string => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data must be object');
  }

  const keys = Object.keys(data);
  return keys.reduce((result, key, index) => {
    const value = data[key];
    return `${result}${key}=${String(value)}${index < keys.length - 1 ? '&' : ''}`;
  }, '?');
};

type FetchWithRetryOptions = RequestInit & { tries?: number };

export const fetchWithRetry = async (
  url: string,
  options: FetchWithRetryOptions = {},
): Promise<Response> => {
  const { tries = 1, ...rest } = options;

  function onError(err: unknown): Promise<Response> {
    const triesLeft = tries - 1;
    if (!triesLeft) {
      return Promise.reject(err);
    }

    return fetchWithRetry(url, { ...rest, tries: triesLeft });
  }

  return fetch(url, rest).catch(onError);
};
