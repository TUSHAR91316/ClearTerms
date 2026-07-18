import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PolicyAnalyzer } from '@/components/policy-analyzer';
import { analyzePolicy } from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  analyzePolicy: jest.fn(),
}));

const mockAnalyzePolicy = analyzePolicy as jest.Mock;

describe('PolicyAnalyzer Component', () => {
  beforeEach(() => {
    // Clear localStorage and mocks before each test
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders correctly with default URL tab selected', () => {
    render(<PolicyAnalyzer />);
    
    // Check tabs
    expect(screen.getByRole('tab', { name: /Analyze URL/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Paste Text/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /History/i })).toHaveAttribute('aria-selected', 'false');
    
    // Check input presence
    expect(screen.getByRole('textbox', { name: /Privacy Policy URL/i })).toBeInTheDocument();
  });

  it('switches to Text tab when clicked', async () => {
    render(<PolicyAnalyzer />);
    const textTab = screen.getByRole('tab', { name: /Paste Text/i });
    
    await userEvent.click(textTab);
    
    expect(textTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('textbox', { name: /Privacy Policy Text/i })).toBeInTheDocument();
  });

  it('submits URL and displays analysis results', async () => {
    const mockResult = {
      transparency_score: 85,
      summary: "This is a good policy.",
      risk_flags: [],
      user_rights: [],
      verdict: "Safe",
    };
    mockAnalyzePolicy.mockResolvedValueOnce(mockResult);

    render(<PolicyAnalyzer />);
    
    const input = screen.getByRole('textbox', { name: /Privacy Policy URL/i });
    const submitBtn = screen.getByRole('button', { name: /Analyze URL/i });

    await userEvent.type(input, 'https://example.com/privacy');
    await userEvent.click(submitBtn);

    expect(mockAnalyzePolicy).toHaveBeenCalledWith('https://example.com/privacy', undefined);
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Safe')).toBeInTheDocument();
      expect(screen.getByText('This is a good policy.')).toBeInTheDocument();
    });
  });

  it('saves analysis to localStorage and shows it in History tab', async () => {
    const mockResult = {
      transparency_score: 45,
      summary: "Risky policy.",
      risk_flags: [],
      user_rights: [],
      verdict: "Caution",
    };
    mockAnalyzePolicy.mockResolvedValueOnce(mockResult);

    render(<PolicyAnalyzer />);
    
    // 1. Analyze a URL
    const input = screen.getByRole('textbox', { name: /Privacy Policy URL/i });
    const submitBtn = screen.getByRole('button', { name: /Analyze URL/i });
    await userEvent.type(input, 'https://risky.com/privacy');
    await userEvent.click(submitBtn);

    // Wait for the fetch and state update
    await waitFor(() => {
      expect(screen.getByText('Caution')).toBeInTheDocument();
    });

    // 2. Switch to History tab
    const historyTab = screen.getByRole('tab', { name: /History/i });
    await userEvent.click(historyTab);

    // 3. Verify history item is displayed
    expect(screen.getByText('https://risky.com/privacy')).toBeInTheDocument();
    expect(screen.getByText('Caution')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockAnalyzePolicy.mockRejectedValueOnce({
      response: { data: { detail: "Invalid URL provided." } }
    });

    render(<PolicyAnalyzer />);
    
    const input = screen.getByRole('textbox', { name: /Privacy Policy URL/i });
    const submitBtn = screen.getByRole('button', { name: /Analyze URL/i });

    await userEvent.type(input, 'https://bad.com');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid URL provided.')).toBeInTheDocument();
    });
  });
});
