/**
 * Frontend Tests: CreateContent Component
 * 
 * This file tests the article/content creation React component
 * Run: npm test -- --testPathPattern=CreateContent.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import CreateContent from '../components/content/CreateContent';
import * as api from '../../utils/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../utils/api');

const mockStore = {
  getState: () => ({
    auth: { user: { _id: '123', role: 'expert' }, isAuthenticated: true },
  }),
  subscribe: () => jest.fn(),
  dispatch: jest.fn(),
};

const renderComponent = () => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <CreateContent />
      </BrowserRouter>
    </Provider>
  );
};

describe('CreateContent Component Tests', () => {
  beforeEach(() => {
    api.post = jest.fn();
    jest.clearAllMocks();
  });

  describe('✅ Component Rendering', () => {
    test('Should render form with all required fields', () => {
      renderComponent();

      expect(screen.getByText(/📝 Create Content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Summary/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content Type/i)).toBeInTheDocument();
    });

    test('Should render all specialization options', () => {
      renderComponent();

      expect(screen.getByText(/🌽 Cereal Crops/i)).toBeInTheDocument();
      expect(screen.getByText(/🐔 Poultry/i)).toBeInTheDocument();
      expect(screen.getByText(/🐟 Fisheries/i)).toBeInTheDocument();
      expect(screen.getByText(/🥬 Horticulture/i)).toBeInTheDocument();
      expect(screen.getByText(/🫘 Legumes/i)).toBeInTheDocument();
      expect(screen.getByText(/📋 General/i)).toBeInTheDocument();
    });

    test('Should render difficulty levels', () => {
      renderComponent();

      const difficultySelect = screen.getByDisplayValue('beginner');
      expect(difficultySelect).toBeInTheDocument();
    });

    test('Should render submit button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('✅ Form Input Handling', () => {
    test('Should update title input', async () => {
      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      await userEvent.type(titleInput, 'Best Practices for Maize');

      expect(titleInput.value).toBe('Best Practices for Maize');
    });

    test('Should update summary input', async () => {
      renderComponent();

      const summaryInput = screen.getByLabelText(/Summary/i);
      await userEvent.type(summaryInput, 'Learn optimal maize growing techniques');

      expect(summaryInput.value).toContain('Learn optimal');
    });

    test('Should update content body', async () => {
      renderComponent();

      const contentInput = screen.getByLabelText(/Content \*/i);
      await userEvent.type(contentInput, '<h1>Maize Guide</h1><p>Content here</p>');

      expect(contentInput.value).toContain('<h1>');
    });

    test('Should update tags', async () => {
      renderComponent();

      const tagsInput = screen.getByLabelText(/Tags/i);
      await userEvent.type(tagsInput, 'maize, agriculture, best-practices');

      expect(tagsInput.value).toBe('maize, agriculture, best-practices');
    });

    test('Should change content type', async () => {
      renderComponent();

      const contentTypeSelect = screen.getByDisplayValue('article');
      fireEvent.change(contentTypeSelect, { target: { value: 'guide' } });

      expect(contentTypeSelect.value).toBe('guide');
    });

    test('Should change difficulty level', async () => {
      renderComponent();

      const difficultySelect = screen.getByDisplayValue('beginner');
      fireEvent.change(difficultySelect, { target: { value: 'advanced' } });

      expect(difficultySelect.value).toBe('advanced');
    });
  });

  describe('✅ Specialization Selection', () => {
    test('Should toggle specialization on click', async () => {
      renderComponent();

      const cerealCropsCheckbox = screen.getByRole('checkbox', { name: /Cereal Crops/i });
      
      expect(cerealCropsCheckbox.checked).toBe(false);

      fireEvent.click(cerealCropsCheckbox);
      expect(cerealCropsCheckbox.checked).toBe(true);

      fireEvent.click(cerealCropsCheckbox);
      expect(cerealCropsCheckbox.checked).toBe(false);
    });

    test('Should allow multiple specializations', async () => {
      renderComponent();

      const cerealCheckbox = screen.getByRole('checkbox', { name: /Cereal Crops/i });
      const poultryCheckbox = screen.getByRole('checkbox', { name: /Poultry/i });
      const fisheriesCheckbox = screen.getByRole('checkbox', { name: /Fisheries/i });

      fireEvent.click(cerealCheckbox);
      fireEvent.click(poultryCheckbox);

      expect(cerealCheckbox.checked).toBe(true);
      expect(poultryCheckbox.checked).toBe(true);
      expect(fisheriesCheckbox.checked).toBe(false);
    });
  });

  describe('✅ Topics Selection', () => {
    test('Should toggle topics', async () => {
      renderComponent();

      const plantingCheckbox = screen.getByRole('checkbox', { name: /Planting/i });
      
      fireEvent.click(plantingCheckbox);
      expect(plantingCheckbox.checked).toBe(true);

      fireEvent.click(plantingCheckbox);
      expect(plantingCheckbox.checked).toBe(false);
    });

    test('Should allow multiple topics', async () => {
      renderComponent();

      const plantingCheckbox = screen.getByRole('checkbox', { name: /Planting/i });
      const pestCheckbox = screen.getByRole('checkbox', { name: /Pest Management/i });
      const fertilizerCheckbox = screen.getByRole('checkbox', { name: /Fertilization/i });

      fireEvent.click(plantingCheckbox);
      fireEvent.click(pestCheckbox);

      expect(plantingCheckbox.checked).toBe(true);
      expect(pestCheckbox.checked).toBe(true);
      expect(fertilizerCheckbox.checked).toBe(false);
    });
  });

  describe('❌ Form Validation', () => {
    test('Should prevent submission without title', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /submit/i });

      const contentInput = screen.getByLabelText(/Content \*/i);
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        // Form should not submit
        expect(api.post).not.toHaveBeenCalled();
      });
    });

    test('Should prevent submission without content', async () => {
      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      await userEvent.type(titleInput, 'Article Title');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).not.toHaveBeenCalled();
      });
    });

    test('Should require minimum content length', async () => {
      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);

      await userEvent.type(titleInput, 'Title');
      await userEvent.type(contentInput, '<p>x</p>');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).not.toHaveBeenCalled();
      });
    });
  });

  describe('✅ Form Submission', () => {
    test('Should submit form with valid data', async () => {
      api.post.mockResolvedValue({ data: { _id: '1', title: 'Test Article' } });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Maize Cultivation Guide');
      await userEvent.type(contentInput, '<h1>Guide</h1><p>Growing maize requires proper preparation.</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          title: 'Maize Cultivation Guide',
          content: expect.stringContaining('<h1>'),
        }));
      });
    });

    test('Should submit with summary', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const summaryInput = screen.getByLabelText(/Summary/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article Title');
      await userEvent.type(summaryInput, 'This is a summary');
      await userEvent.type(contentInput, '<p>Content body</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          summary: 'This is a summary',
        }));
      });
    });

    test('Should submit with tags', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const tagsInput = screen.getByLabelText(/Tags/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article');
      await userEvent.type(contentInput, '<p>Content</p>');
      await userEvent.type(tagsInput, 'tag1, tag2, tag3');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'],
        }));
      });
    });

    test('Should submit with selected specializations', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const cerealCheckbox = screen.getByRole('checkbox', { name: /Cereal Crops/i });
      fireEvent.click(cerealCheckbox);

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article');
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          metadata: expect.objectContaining({
            farmingSpecializations: expect.arrayContaining(['cereal_crops']),
          }),
        }));
      });
    });

    test('Should submit with selected topics', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const plantingCheckbox = screen.getByRole('checkbox', { name: /Planting/i });
      fireEvent.click(plantingCheckbox);

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article');
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          metadata: expect.objectContaining({
            topics: expect.arrayContaining(['planting']),
          }),
        }));
      });
    });
  });

  describe('✅ Success Message & Navigation', () => {
    test('Should show success message after submission', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article');
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/✅ Content submitted/i)).toBeInTheDocument();
      });
    });

    test('Should disable submit button while submitting', async () => {
      api.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article');
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('❌ Error Handling', () => {
    test('Should handle API errors gracefully', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article');
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        // Button should be re-enabled
        expect(submitButton.disabled).toBe(false);
      });
    });

    test('Should handle validation errors from backend', async () => {
      api.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Title already exists' },
        },
      });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Duplicate Article');
      await userEvent.type(contentInput, '<p>Content</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(false);
      });
    });
  });

  describe('✅ Back Button', () => {
    test('Should have back button to navigate', () => {
      renderComponent();

      const backButton = screen.getByRole('button', { name: /←/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('✅ Special Characters Handling', () => {
    test('Should handle special characters in title', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await userEvent.type(titleInput, 'Article: Best & Latest Practices (2026)');
      await userEvent.type(contentInput, '<p>Content with & special chars & "quotes"</p>');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          title: expect.stringContaining('&'),
        }));
      });
    });

    test('Should handle HTML in content', async () => {
      api.post.mockResolvedValue({ data: { _id: '1' } });

      renderComponent();

      const titleInput = screen.getByLabelText(/Title/i);
      const contentInput = screen.getByLabelText(/Content \*/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      const htmlContent = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
        <ul><li>List item</li></ul>
      `;

      await userEvent.type(titleInput, 'HTML Article');
      await userEvent.type(contentInput, htmlContent);

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/content', expect.objectContaining({
          content: expect.stringContaining('<h1>'),
        }));
      });
    });
  });
});
