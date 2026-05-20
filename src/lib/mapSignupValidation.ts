/** Maps validateSignup() English messages to i18n keys (defaultValue = source string). */
export function mapSignupValidationMessage(
  message: string,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  if (message === 'Name is required.' || message.includes('Name must')) {
    return t('auth.nameRequired')
  }
  if (message === 'Email is required.') {
    return t('auth.emailRequired')
  }
  if (message.includes('valid email')) {
    return t('auth.emailInvalid')
  }
  if (message === 'Password is required.') {
    return t('auth.passwordRequired')
  }
  if (message.startsWith('Use ') || message.includes('password')) {
    return t('auth.passwordPolicyInline', {
      defaultValue:
        'This password is still too weak. Try a longer passphrase or use our secure suggestion.',
    })
  }
  return message
}
