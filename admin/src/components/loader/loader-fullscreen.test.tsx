import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoaderFullScreen from './loader-fullscreen';

describe('LoaderFullScreen', () => {
  it('renders a labelled loading spinner', () => {
    render(<LoaderFullScreen />);
    expect(screen.getByLabelText('Laddar information')).toBeInTheDocument();
  });
});
