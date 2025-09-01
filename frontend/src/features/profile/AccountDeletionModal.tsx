import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { deleteAccount } from './api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDeletionModal({ isOpen, onClose }: AccountDeletionModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const { logout } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    if (confirmation !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }

    setIsLoading(true);

    try {
      await deleteAccount({ password });
      
      // Logout and redirect to login
      logout();
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmation('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-2 mb-6">
          <Trash2 className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Delete Account
          </h2>
        </div>

        {/* Warning Alert */}
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 mb-6">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action cannot be undone. All your data, including memories, 
            conversations, and settings will be permanently deleted.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Verification */}
          <div>
            <Label htmlFor="password">Enter Your Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This is required to confirm account deletion
            </p>
          </div>

          {/* Confirmation */}
          <div>
            <Label htmlFor="confirmation">
              Type <span className="font-mono text-red-600">DELETE</span> to confirm
            </Label>
            <Input
              id="confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This confirms you understand the consequences
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isLoading || confirmation !== 'DELETE'}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
