import { describe, expect, it, vi } from 'vitest';
import Block from './Block';

describe('Block', () => {
  it('создает элемент с переданным тегом и рендерит начальный контент', () => {
    class TextBlock extends Block<{ text: string }> {
      render() {
        return this.props.text;
      }
    }

    const block = new TextBlock('span', { text: 'hello' });

    expect(block.getContent().tagName).toBe('SPAN');
    expect(block.getContent().innerHTML).toBe('hello');
  });

  it('вызывает componentDidUpdate и перерисовывает при setProps', () => {
    class UpdateBlock extends Block<{ text: string }> {
      updates: Array<{ oldProps: { text: string }; newProps: { text: string } }> = [];

      render() {
        return this.props.text;
      }

      componentDidUpdate(oldProps: { text: string }, newProps: { text: string }) {
        this.updates.push({ oldProps, newProps });
        return true;
      }
    }

    const block = new UpdateBlock('div', { text: 'one' });

    block.setProps({ text: 'two' });

    expect(block.updates).toHaveLength(1);
    expect(block.updates[0].oldProps.text).toBe('two');
    expect(block.updates[0].newProps.text).toBe('two');
    expect(block.getContent().innerHTML).toBe('two');
  });

  it('не перерисовывает, если componentDidUpdate возвращает false', () => {
    class NoUpdateBlock extends Block<{ text: string }> {
      render() {
        return this.props.text;
      }

      componentDidUpdate() {
        return false;
      }
    }

    const block = new NoUpdateBlock('div', { text: 'one' });

    expect(block.getContent().innerHTML).toBe('one');

    block.setProps({ text: 'two' });

    expect(block.getContent().innerHTML).toBe('one');
  });

  it('заменяет обработчики событий при повторном рендере', () => {
    class EventBlock extends Block<{ events?: Record<string, EventListener> }> {
      render() {
        return '';
      }
    }

    const onClickFirst = vi.fn();
    const block = new EventBlock('button', { events: { click: onClickFirst } });

    block.getContent().click();

    expect(onClickFirst).toHaveBeenCalledTimes(1);

    const onClickSecond = vi.fn();
    block.setProps({ events: { click: onClickSecond } });

    block.getContent().click();

    expect(onClickFirst).toHaveBeenCalledTimes(1);
    expect(onClickSecond).toHaveBeenCalledTimes(1);
  });
});
