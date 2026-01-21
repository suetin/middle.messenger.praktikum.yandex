import { describe, expect, it, vi } from 'vitest';
import EventBus from './EventBus';

describe('EventBus', () => {
  it('вызывает подписчика при emit с переданными аргументами', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('ping', listener);
    bus.emit('ping', 'a', 2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('a', 2);
  });

  it('вызывает всех подписчиков одного события', () => {
    const bus = new EventBus();
    const first = vi.fn();
    const second = vi.fn();

    bus.on('ping', first);
    bus.on('ping', second);
    bus.emit('ping');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('не вызывает подписчика после off', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('ping', listener);
    bus.off('ping', listener);
    bus.emit('ping');

    expect(listener).not.toHaveBeenCalled();
  });

  it('кидает ошибку при off для неизвестного события', () => {
    const bus = new EventBus();

    expect(() => bus.off('missing', () => {})).toThrow('Нет события');
  });

  it('кидает ошибку при emit для неизвестного события', () => {
    const bus = new EventBus();

    expect(() => bus.emit('missing')).toThrow('Нет события');
  });
});
