// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../client/src/ui.jsx';

describe('ConfirmModal accessibility', () => {
  it('labels the dialog and closes it with Escape', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal title="Delete workout?" message="This cannot be undone." onConfirm={() => {}} onCancel={onCancel} />);
    expect(screen.getByRole('dialog', { name: 'Delete workout?' })).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
