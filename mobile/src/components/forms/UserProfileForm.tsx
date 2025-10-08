import React, { useState } from 'react';
import FormLayout from '../ui/FormLayout';
import FormSection from '../ui/FormSection';
import FormField from '../ui/FormField';
import { FormValidator, CommonRules } from '../../utils/formValidation';
import { hapticFeedback } from '../../utils/haptics';

interface UserProfile {
  full_name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
}

interface UserProfileFormProps {
  initialData?: Partial<UserProfile>;
  onSubmit: (data: UserProfile) => void;
  onCancel?: () => void;
  loading?: boolean;
  variant?: 'default' | 'modal' | 'fullscreen';
  testID?: string;
}

const validationRules = {
  full_name: {
    ...CommonRules.required('Full name is required'),
    ...CommonRules.name(),
    ...CommonRules.minLength(2, 'Name must be at least 2 characters'),
  },
  email: CommonRules.email(),
  phone: CommonRules.phone(),
  bio: CommonRules.maxLength(500, 'Bio must be no more than 500 characters'),
  location: CommonRules.maxLength(100, 'Location must be no more than 100 characters'),
  website: {
    pattern: /^https?:\/\/.+/,
    message: 'Website must be a valid URL starting with http:// or https://',
  },
};

export default function UserProfileForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  variant = 'default',
  testID,
}: UserProfileFormProps) {
  const [data, setData] = useState<UserProfile>({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formValidator] = useState(new FormValidator(validationRules));

  const updateData = (field: keyof UserProfile, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: keyof UserProfile) => {
    const error = formValidator.validateField(field, data[field] || '');
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
    return !error;
  };

  const validateForm = () => {
    const newErrors = formValidator.validateForm(data);
    setErrors(newErrors);
    return !formValidator.hasErrors(newErrors);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      hapticFeedback.error();
      return;
    }

    hapticFeedback.success();
    onSubmit(data);
  };

  const handleCancel = () => {
    hapticFeedback.light();
    onCancel?.();
  };

  return (
    <FormLayout
      title="Profile Information"
      subtitle="Update your personal information"
      primaryAction={{
        label: loading ? 'Saving...' : 'Save Changes',
        onPress: handleSubmit,
        loading,
        disabled: loading,
        testID: 'submit-button',
      }}
      secondaryAction={onCancel ? {
        label: 'Cancel',
        onPress: handleCancel,
        variant: 'outline',
        testID: 'cancel-button',
      } : undefined}
      variant={variant}
      testID={testID}
    >
      <FormSection
        title="Basic Information"
        subtitle="Your personal details"
        variant="card"
      >
        <FormField
          name="full_name"
          label="Full Name"
          value={data.full_name}
          onChangeText={(value) => updateData('full_name', value)}
          onBlur={() => validateField('full_name')}
          error={errors.full_name}
          placeholder="Enter your full name"
          required
          testID="fullname-input"
        />
        
        <FormField
          name="email"
          label="Email Address"
          value={data.email}
          onChangeText={(value) => updateData('email', value)}
          onBlur={() => validateField('email')}
          error={errors.email}
          keyboardType="email-address"
          placeholder="Enter your email address"
          required
          testID="email-input"
        />
        
        <FormField
          name="phone"
          label="Phone Number"
          value={data.phone || ''}
          onChangeText={(value) => updateData('phone', value)}
          onBlur={() => validateField('phone')}
          error={errors.phone}
          keyboardType="phone-pad"
          placeholder="Enter your phone number"
          testID="phone-input"
        />
      </FormSection>

      <FormSection
        title="Additional Information"
        subtitle="Optional details about yourself"
        variant="card"
      >
        <FormField
          name="bio"
          label="Bio"
          value={data.bio || ''}
          onChangeText={(value) => updateData('bio', value)}
          onBlur={() => validateField('bio')}
          error={errors.bio}
          placeholder="Tell us about yourself..."
          multiline
          numberOfLines={4}
          testID="bio-input"
        />
        
        <FormField
          name="location"
          label="Location"
          value={data.location || ''}
          onChangeText={(value) => updateData('location', value)}
          onBlur={() => validateField('location')}
          error={errors.location}
          placeholder="City, Country"
          testID="location-input"
        />
        
        <FormField
          name="website"
          label="Website"
          value={data.website || ''}
          onChangeText={(value) => updateData('website', value)}
          onBlur={() => validateField('website')}
          error={errors.website}
          keyboardType="default"
          placeholder="https://yourwebsite.com"
          testID="website-input"
        />
      </FormSection>
    </FormLayout>
  );
}

// No styles needed for this component
