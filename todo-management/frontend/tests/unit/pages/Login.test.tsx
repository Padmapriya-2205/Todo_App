import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from '../../../src/pages/Login';

vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn().mockResolvedValue(undefined) }),
}));

describe('Login', () => {
  it('renders fields and validates required values', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Username and password are required');
  });
});
