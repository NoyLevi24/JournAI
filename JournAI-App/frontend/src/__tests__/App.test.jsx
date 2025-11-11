import { describe, it, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import React from 'react';

// Mock the global localStorage
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'journai_route') return 'home';
    if (key === 'journai_token') return null;
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock the fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the components that might cause issues
vi.mock('../App.tsx', async (importOriginal) => {
  const actual = await importOriginal();
  const MockNavBar = () => <div>NavBar</div>;
  const MockHome = () => <div>Home</div>;
  
  return {
    ...actual,
    NavBar: MockNavBar,
    Home: MockHome,
  };
});

describe('App', () => {
  beforeAll(() => {
    // Set up the localStorage mock
    global.localStorage = localStorageMock;
    
    // Mock the fetch responses
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(null),
    });
  });

  it('renders without crashing', () => {
    // Just render the app and make sure it doesn't throw
    render(<App />);
    
    // Simple assertion that the app rendered the sign in button
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});