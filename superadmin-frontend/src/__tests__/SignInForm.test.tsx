import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '../components/auth/SignInForm';

// Mock the auth context
const mockLogin = jest.fn();
const mockSendOtp = jest.fn();
const mockClearError = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    sendOtp: mockSendOtp,
    error: null,
    clearError: mockClearError,
  }),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sign in form correctly', () => {
    render(<SignInForm />);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('otp-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-otp-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates email field', async () => {
    render(<SignInForm />);

    const emailInput = screen.getByTestId('email-input');
    const sendOtpButton = screen.getByTestId('send-otp-button');

    // Try to send OTP without email
    await userEvent.click(sendOtpButton);
    expect(mockSendOtp).not.toHaveBeenCalled();

    // Enter invalid email
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(sendOtpButton);
    expect(mockSendOtp).not.toHaveBeenCalled();

    // Enter valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendOtpButton);
    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  it('validates password field', async () => {
    mockSendOtp.mockResolvedValueOnce({});

    render(<SignInForm />);

    const emailInput = screen.getByTestId('email-input');
    const otpInput = screen.getByTestId('otp-input');
    const sendOtpButton = screen.getByTestId('send-otp-button');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter email and send OTP
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendOtpButton);
    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    // Enter OTP but leave password empty
    await userEvent.type(otpInput, '123456');

    // Attempt to submit
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('validates OTP field', async () => {
    mockSendOtp.mockResolvedValueOnce({});

    render(<SignInForm />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const otpInput = screen.getByTestId('otp-input');
    const sendOtpButton = screen.getByTestId('send-otp-button');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter email and send OTP
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendOtpButton);
    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    // Enter password and invalid OTP
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(otpInput, '12345');

    // Attempt to submit
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/OTP must be exactly 6 digits/i)).toBeInTheDocument();
    });
  });

  it('validates OTP is sent before login', async () => {
    render(<SignInForm />);

    const passwordInput = screen.getByTestId('password-input');
    const otpInput = screen.getByTestId('otp-input');
    const form = screen.getByTestId('signin-form');

    // Fill form without sending OTP
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(otpInput, '123456');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please send OTP first')).toBeInTheDocument();
    });
  });

  it('handles successful login flow', async () => {
    mockSendOtp.mockResolvedValueOnce({});
    mockLogin.mockResolvedValueOnce({});

    render(<SignInForm />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const otpInput = screen.getByTestId('otp-input');
    const sendOtpButton = screen.getByTestId('send-otp-button');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill form
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(otpInput, '123456');

    // Send OTP
    await userEvent.click(sendOtpButton);
    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    // Submit form
    await userEvent.click(submitButton);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        otp: '123456',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading states', async () => {
    mockSendOtp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<SignInForm />);

    const emailInput = screen.getByTestId('email-input');
    const sendOtpButton = screen.getByTestId('send-otp-button');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
    expect(sendOtpButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Send OTP')).toBeInTheDocument();
    });
    expect(sendOtpButton).not.toBeDisabled();
  });
});