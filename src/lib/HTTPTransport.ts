import { queryStringify, type QueryParams } from './utils';

const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

type HTTPMethod = (typeof METHODS)[keyof typeof METHODS];
type RequestData = Document | XMLHttpRequestBodyInit | QueryParams;

type RequestOptions = {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  data?: RequestData;
  timeout?: number;
  withCredentials?: boolean;
};

type RequestOptionsWithoutMethod = Omit<RequestOptions, 'method'>;

export default class HTTPTransport {
  private createMethod(method: HTTPMethod) {
    return (url: string, options: RequestOptionsWithoutMethod = {}): Promise<XMLHttpRequest> =>
      this.request(url, { ...options, method });
  }

  get = this.createMethod(METHODS.GET);

  post = this.createMethod(METHODS.POST);

  put = this.createMethod(METHODS.PUT);

  delete = this.createMethod(METHODS.DELETE);

  request = (
    url: string,
    options: RequestOptions = {},
  ): Promise<XMLHttpRequest> => {
    const { headers = {}, method, data, timeout = 5000, withCredentials = true } = options;

    return new Promise<XMLHttpRequest>((resolve, reject) => {
      if (!method) {
        reject(new Error('No method'));
        return;
      }

      const xhr = new XMLHttpRequest();
      const isGet = method === METHODS.GET;

      const requestUrl = isGet && data ? `${url}${queryStringify(data as QueryParams)}` : url;

      xhr.open(method, requestUrl);
      xhr.withCredentials = withCredentials;

      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.onload = function () {
        resolve(xhr);
      };

      xhr.onabort = reject;
      xhr.onerror = reject;

      xhr.timeout = timeout;
      xhr.ontimeout = reject;

      if (isGet || data === undefined || data === null) {
        xhr.send();
      } else {
        xhr.send(data as Document | XMLHttpRequestBodyInit);
      }
    });
  };
}
