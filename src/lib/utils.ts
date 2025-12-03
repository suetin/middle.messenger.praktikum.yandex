export type QueryParams = Record<string, unknown>;

export const queryStringify = (data: QueryParams): string => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data must be object');
  }

  const params = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else {
      params.append(key, String(value));
    }
  });

  const search = params.toString();
  return search ? `?${search}` : '';
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
