import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HTTPTransport from './HTTPTransport';

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = [];

  method: string | null = null;
  url: string | null = null;
  headers: Record<string, string> = {};
  withCredentials = false;
  timeout = 0;
  sentData: Document | XMLHttpRequestBodyInit | null | undefined;

  onload: ((ev: Event) => void) | null = null;
  onabort: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  ontimeout: ((ev: Event) => void) | null = null;

  open = vi.fn((method: string, url: string) => {
    this.method = method;
    this.url = url;
  });

  setRequestHeader = vi.fn((key: string, value: string) => {
    this.headers[key] = value;
  });

  send = vi.fn((data?: Document | XMLHttpRequestBodyInit | null) => {
    this.sentData = data;
  });

  constructor() {
    MockXMLHttpRequest.instances.push(this);
  }
}

describe('HTTPTransport', () => {
  const OriginalXHR = globalThis.XMLHttpRequest;

  beforeEach(() => {
    MockXMLHttpRequest.instances = [];
    globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = OriginalXHR;
    vi.restoreAllMocks();
  });

  it('добавляет query-параметры для GET и отправляет без тела', async () => {
    const transport = new HTTPTransport();

    const promise = transport.get('/api/test', { data: { a: 1, b: 'x' } });
    const xhr = MockXMLHttpRequest.instances[0];

    expect(xhr.open).toHaveBeenCalledWith('GET', '/api/test?a=1&b=x');
    expect(xhr.send).toHaveBeenCalledTimes(1);
    expect(xhr.send.mock.calls[0].length).toBe(0);

    xhr.onload?.(new Event('load'));

    await expect(promise).resolves.toBe(xhr as unknown as XMLHttpRequest);
  });

  it('отправляет данные и заголовки для POST', async () => {
    const transport = new HTTPTransport();
    const body = JSON.stringify({ ok: true });

    const promise = transport.post('/api/test', {
      data: body,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: false,
      timeout: 1000,
    });

    const xhr = MockXMLHttpRequest.instances[0];

    expect(xhr.open).toHaveBeenCalledWith('POST', '/api/test');
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(xhr.withCredentials).toBe(false);
    expect(xhr.timeout).toBe(1000);
    expect(xhr.send).toHaveBeenCalledWith(body);

    xhr.onload?.(new Event('load'));

    await expect(promise).resolves.toBe(xhr as unknown as XMLHttpRequest);
  });

  it('не добавляет query-параметры и отправляет тело для PUT/DELETE', async () => {
    const transport = new HTTPTransport();
    const body = JSON.stringify({ name: 'value' });

    const putPromise = transport.put('/api/test', { data: body });
    const putXhr = MockXMLHttpRequest.instances[0];

    expect(putXhr.open).toHaveBeenCalledWith('PUT', '/api/test');
    expect(putXhr.send).toHaveBeenCalledWith(body);

    putXhr.onload?.(new Event('load'));

    await expect(putPromise).resolves.toBe(putXhr as unknown as XMLHttpRequest);

    const deletePromise = transport.delete('/api/test', { data: body });
    const deleteXhr = MockXMLHttpRequest.instances[1];

    expect(deleteXhr.open).toHaveBeenCalledWith('DELETE', '/api/test');
    expect(deleteXhr.send).toHaveBeenCalledWith(body);

    deleteXhr.onload?.(new Event('load'));

    await expect(deletePromise).resolves.toBe(deleteXhr as unknown as XMLHttpRequest);
  });

  it('возвращает ошибку при отсутствии метода', async () => {
    const transport = new HTTPTransport();

    await expect(transport.request('/api/test')).rejects.toThrow('No method');
  });

  it('reject при onerror/ontimeout/onabort', async () => {
    const transport = new HTTPTransport();

    const errorPromise = transport.get('/api/test');
    const errorXhr = MockXMLHttpRequest.instances[0];

    errorXhr.onerror?.(new Event('error'));
    await expect(errorPromise).rejects.toBeInstanceOf(Event);

    const timeoutPromise = transport.get('/api/test');
    const timeoutXhr = MockXMLHttpRequest.instances[1];

    timeoutXhr.ontimeout?.(new Event('timeout'));
    await expect(timeoutPromise).rejects.toBeInstanceOf(Event);

    const abortPromise = transport.get('/api/test');
    const abortXhr = MockXMLHttpRequest.instances[2];

    abortXhr.onabort?.(new Event('abort'));
    await expect(abortPromise).rejects.toBeInstanceOf(Event);
  });
});
