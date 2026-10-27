import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it.each<Unit>([
    'celsius',
    'fahrenheit',
  ])('apresenta dois botões e anuncia apenas %s como ativo', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);
    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });

    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: '°C — Celsius' })).toHaveTextContent('°C');
    expect(within(group).getByRole('button', { name: '°F — Fahrenheit' })).toHaveTextContent('°F');
    expect(
      within(group).getByRole('button', {
        name: unit === 'celsius' ? '°C — Celsius' : '°F — Fahrenheit',
        pressed: true,
      }),
    ).toBeInTheDocument();
    expect(within(group).getAllByRole('button', { pressed: false })).toHaveLength(1);
  });

  it('envia a unidade de cada botão e mantém a seleção controlada pelas props', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°F — Fahrenheit' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(screen.getByRole('button', { name: '°C — Celsius', pressed: true })).toBeInTheDocument();

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);

    expect(
      screen.getByRole('button', { name: '°F — Fahrenheit', pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '°C — Celsius', pressed: false }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°C — Celsius' }));
    expect(onChange).toHaveBeenNthCalledWith(2, 'celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('permite navegar por Tab e Shift+Tab e ativar com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    const celsius = screen.getByRole('button', { name: '°C — Celsius' });
    const fahrenheit = screen.getByRole('button', { name: '°F — Fahrenheit' });

    await user.tab();
    expect(celsius).toHaveFocus();
    expect(celsius).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-accent-400');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenNthCalledWith(1, 'celsius');

    await user.tab();
    expect(fahrenheit).toHaveFocus();
    expect(fahrenheit).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-accent-400');
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(2, 'fahrenheit');
    expect(onChange).toHaveBeenCalledTimes(2);

    await user.tab({ shift: true });
    expect(celsius).toHaveFocus();
  });

  it('não submete um formulário ao selecionar a unidade', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '°F — Fahrenheit' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
