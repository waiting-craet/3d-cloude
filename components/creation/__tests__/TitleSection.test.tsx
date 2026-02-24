import React from 'react';
import { render, screen } from '@testing-library/react';
import TitleSection from '../TitleSection';

describe('TitleSection', () => {
  it('should render the title text', () => {
    render(<TitleSection />);
    expect(screen.getByText('知识图谱')).toBeInTheDocument();
  });

  it('should have the correct styling applied', () => {
    const { container } = render(<TitleSection />);
    const titleSection = container.querySelector('[class*="titleSection"]');
    expect(titleSection).toBeInTheDocument();
  });

  it('should render title text in a div with titleText class', () => {
    const { container } = render(<TitleSection />);
    const titleText = container.querySelector('[class*="titleText"]');
    expect(titleText).toBeInTheDocument();
    expect(titleText?.textContent).toBe('知识图谱');
  });
});
