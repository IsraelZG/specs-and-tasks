import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from '../../src/components/FormField/FormField';

describe('FormField', () => {
  it('renderiza sem erro com label e children (smoke)', () => {
    render(
      <FormField label="Email">
        <input id="email" />
      </FormField>
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renderiza errorText quando fornecido', () => {
    render(
      <FormField label="Name" errorText="Required">
        <input id="name" />
      </FormField>
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renderiza helpText quando fornecido', () => {
    render(
      <FormField label="Name" helpText="Enter your full name">
        <input id="name" />
      </FormField>
    );
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('label tem htmlFor quando fornecido', () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" />
      </FormField>
    );
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <FormField ref={ref} label="X">
        <input />
      </FormField>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
