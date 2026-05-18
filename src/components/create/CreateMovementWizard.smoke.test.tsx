import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CreateMovementWizard from './CreateMovementWizard'
import { emptyMovementFields } from '../../lib/movementFieldValues'
import { CREATE_WIZARD_STEP_COUNT } from '../../lib/createWizardConfig'
import { buildCreatePreviewPost } from '../../lib/createMovementDraft'

const baseProps = {
  totalSteps: CREATE_WIZARD_STEP_COUNT,
  onBack: () => {},
  onContinue: () => {},
  canContinue: true,
  movementType: 'raise_voice' as const,
  typeExplicitlyChosen: true,
  onSelectType: () => {},
  title: 'Test title',
  onTitleChange: () => {},
  description: 'A long enough description for the movement story field.',
  onDescriptionChange: () => {},
  movementFields: emptyMovementFields(),
  onMovementFieldChange: () => {},
  category: 'Education' as const,
  onCategoryChange: () => {},
  postingIdentity: 'profile' as const,
  onPostingIdentityChange: () => {},
  authorName: 'Test User',
  onAuthorNameChange: () => {},
  requireProfileOnly: false,
  mapLocation: { location_name: '', latitude: null, longitude: null },
  onMapChange: () => {},
  fieldErrors: {},
  previewPost: null,
  loading: false,
  canPublish: true,
  goodFaithConfirmed: true,
  onGoodFaithChange: () => {},
  onSubmit: () => {},
  onSaveDraft: () => {},
  onCreateAnother: () => {},
  pendingMedia: {
    files: [],
    counts: { images: 0, documents: 0 },
    hasFiles: false,
    remainingImages: 4,
    remainingDocuments: 2,
    addFiles: () => {},
    removeFile: () => {},
    clearFiles: () => {},
    allIssues: [],
    validation: { valid: true, issues: [] },
  },
  uploadingMedia: false,
  error: null,
  publishedId: null,
}

describe('CreateMovementWizard smoke', () => {
  for (let step = 1; step <= CREATE_WIZARD_STEP_COUNT; step++) {
    it(`renders step ${step} without crashing`, () => {
      const previewPost =
        step === 6
          ? buildCreatePreviewPost({
              title: 'Test title',
              description: 'A long enough description for the movement story field.',
              category: 'Education',
              authorName: 'Test User',
              postingIdentity: 'profile',
              youthVoiceId: 'YV-ABCDE',
              movementType: 'raise_voice',
              movementFields: emptyMovementFields(),
              userId: 'user-1',
            })
          : null

      render(
        <MemoryRouter>
          <CreateMovementWizard {...baseProps} step={step} previewPost={previewPost} />
        </MemoryRouter>,
      )

      expect(screen.getByText(new RegExp(`Step ${step} of`, 'i'))).toBeTruthy()
    })
  }
})
