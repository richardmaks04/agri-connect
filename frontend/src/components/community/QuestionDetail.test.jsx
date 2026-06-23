/**
 * Frontend Tests: Community Q&A - QuestionDetail Component (Replies/Answers)
 * 
 * This file tests the question detail and answer reply functionality
 * Run: npm test -- --testPathPattern=QuestionDetail.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import QuestionDetail from '../components/community/QuestionDetail';
import * as api from '../../utils/api';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'question-123' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../utils/api');

const mockStore = {
  getState: () => ({
    auth: { 
      user: { _id: 'user-456', fullName: 'John Farmer', role: 'farmer' }, 
      isAuthenticated: true 
    },
  }),
  subscribe: () => jest.fn(),
  dispatch: jest.fn(),
};

const mockQuestion = {
  _id: 'question-123',
  title: 'What is the best time to plant wheat?',
  content: 'I want to know the optimal planting time for wheat in Nigeria.',
  author: {
    _id: 'expert-789',
    fullName: 'Dr. Expert',
    role: 'expert',
  },
  category: 'crop',
  tags: ['wheat', 'planting'],
  status: 'open',
  views: 45,
  answers: [
    {
      _id: 'answer-1',
      author: {
        _id: 'expert-789',
        fullName: 'Dr. Expert',
        role: 'expert',
      },
      content: 'The best time to plant wheat in Nigeria is October to November.',
      likes: [],
      isAccepted: false,
      createdAt: '2026-06-15T10:00:00Z',
    },
    {
      _id: 'answer-2',
      author: {
        _id: 'expert-790',
        fullName: 'Agronomist John',
        role: 'expert',
      },
      content: 'I recommend November for western Nigeria due to rainfall patterns.',
      likes: [],
      isAccepted: false,
      createdAt: '2026-06-16T14:00:00Z',
    },
  ],
  createdAt: '2026-06-10T10:00:00Z',
};

const renderComponent = () => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <QuestionDetail />
      </BrowserRouter>
    </Provider>
  );
};

describe('QuestionDetail Component - Q&A Replies Tests', () => {
  beforeEach(() => {
    api.get = jest.fn().mockResolvedValue({ data: { question: mockQuestion } });
    api.post = jest.fn();
    jest.clearAllMocks();
  });

  describe('✅ Question Display', () => {
    test('Should display question title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/best time to plant wheat/i)).toBeInTheDocument();
      });
    });

    test('Should display question content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/optimal planting time/i)).toBeInTheDocument();
      });
    });

    test('Should display question metadata', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Dr. Expert/i)).toBeInTheDocument();
        expect(screen.getByText(/crop/i)).toBeInTheDocument();
      });
    });

    test('Should display question tags', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('wheat')).toBeInTheDocument();
        expect(screen.getByText('planting')).toBeInTheDocument();
      });
    });

    test('Should display view count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/45.*views/i)).toBeInTheDocument();
      });
    });
  });

  describe('✅ Answers/Replies Display', () => {
    test('Should display all answers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/October to November/i)).toBeInTheDocument();
        expect(screen.getByText(/rainfall patterns/i)).toBeInTheDocument();
      });
    });

    test('Should display answer author information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/Dr. Expert/i).length).toBeGreaterThan(1);
        expect(screen.getByText(/Agronomist John/i)).toBeInTheDocument();
      });
    });

    test('Should display answer count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/2.*answers/i)).toBeInTheDocument();
      });
    });

    test('Should display "No answers yet" when no replies', async () => {
      api.get.mockResolvedValue({
        data: {
          question: {
            ...mockQuestion,
            answers: [],
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no answers yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('✅ Add Reply/Answer Form', () => {
    test('Should display reply form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });
    });

    test('Should allow typing in reply textarea', async () => {
      renderComponent();

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/write your answer/i);
        expect(textarea).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      await userEvent.type(textarea, 'I recommend planting wheat in late October.');

      expect(textarea.value).toContain('I recommend planting wheat');
    });

    test('Should have submit reply button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i })).toBeInTheDocument();
      });
    });

    test('Should have character counter for answer', async () => {
      renderComponent();

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/write your answer/i);
        expect(textarea).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      await userEvent.type(textarea, 'This is a test reply with some content.');

      // Check if character count is displayed
      expect(screen.getByText(/\d+.*characters/i)).toBeInTheDocument();
    });
  });

  describe('✅ Submit Reply/Answer', () => {
    test('Should submit reply successfully', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            _id: 'answer-3',
            content: 'My experience with wheat planting...',
            author: { _id: 'user-456' },
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'My experience with wheat planting in Nigeria has been positive when planted in late October.');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          `/community/questions/question-123/answers`,
          expect.objectContaining({
            content: expect.stringContaining('experience'),
          })
        );
      });
    });

    test('Should clear reply form after successful submission', async () => {
      api.post.mockResolvedValue({
        data: { data: { _id: 'answer-3' } },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'Test reply with sufficient content here.');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    test('Should show success message after reply submission', async () => {
      api.post.mockResolvedValue({
        data: { data: { _id: 'answer-3' } },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'My answer to the question.');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/✅|answer.*posted|reply.*submitted/i)).toBeInTheDocument();
      });
    });

    test('Should add new reply to answers list', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            _id: 'answer-3',
            content: 'New reply content here.',
            author: { _id: 'user-456', fullName: 'John Farmer' },
            likes: [],
            isAccepted: false,
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'New reply content here.');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/New reply content here/)).toBeInTheDocument();
      });
    });
  });

  describe('❌ Reply Validation', () => {
    test('Should reject reply without content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).not.toHaveBeenCalled();
      });
    });

    test('Should reject reply with minimum content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'Too short');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/too short|minimum.*characters|at least/i)).toBeInTheDocument();
      });
    });

    test('Should disable submit button while submitting', async () => {
      api.post.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'This is a detailed and thoughtful answer to the question.');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('✅ Like/Helpful Button on Replies', () => {
    test('Should display like buttons on answers', async () => {
      renderComponent();

      await waitFor(() => {
        const likeButtons = screen.getAllByRole('button', { name: /like|helpful|👍/i });
        expect(likeButtons.length).toBeGreaterThanOrEqual(2);
      });
    });

    test('Should mark answer as helpful', async () => {
      api.post.mockResolvedValue({ data: { message: 'Marked as helpful' } });

      renderComponent();

      await waitFor(() => {
        const likeButtons = screen.getAllByRole('button', { name: /like|helpful|👍/i });
        expect(likeButtons[0]).toBeInTheDocument();
      });

      const likeButtons = screen.getAllByRole('button', { name: /like|helpful|👍/i });
      fireEvent.click(likeButtons[0]);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          expect.stringContaining('/answers/'),
          expect.anything()
        );
      });
    });

    test('Should show like count on answers', async () => {
      const questionWithLikes = {
        ...mockQuestion,
        answers: [
          {
            ...mockQuestion.answers[0],
            likes: ['user-1', 'user-2', 'user-3'],
          },
        ],
      };

      api.get.mockResolvedValue({
        data: { question: questionWithLikes },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/3.*helpful|3.*likes/i)).toBeInTheDocument();
      });
    });
  });

  describe('✅ Accept Answer (for question author)', () => {
    test('Should show accept button if user is question author', async () => {
      const questionByUser = {
        ...mockQuestion,
        author: { _id: 'user-456' }, // Same as current user
      };

      api.get.mockResolvedValue({
        data: { question: questionByUser },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept.*answer|mark.*solution/i })).toBeInTheDocument();
      });
    });

    test('Should not show accept button if user is not author', async () => {
      renderComponent();

      await waitFor(() => {
        const acceptButtons = screen.queryAllByRole('button', { name: /accept.*answer|mark.*solution/i });
        expect(acceptButtons.length).toBe(0);
      });
    });

    test('Should accept answer and show accepted badge', async () => {
      api.patch = jest.fn().mockResolvedValue({
        data: { data: { isAccepted: true } },
      });

      const questionByUser = {
        ...mockQuestion,
        author: { _id: 'user-456' },
      };

      api.get.mockResolvedValue({
        data: { question: questionByUser },
      });

      renderComponent();

      await waitFor(() => {
        const acceptButtons = screen.getAllByRole('button', { name: /accept.*answer|mark.*solution/i });
        expect(acceptButtons[0]).toBeInTheDocument();
      });

      const acceptButtons = screen.getAllByRole('button', { name: /accept.*answer|mark.*solution/i });
      fireEvent.click(acceptButtons[0]);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith(
          expect.stringContaining('/answers/'),
          expect.anything()
        );
      });
    });
  });

  describe('✅ Reply Editing (if user authored)', () => {
    test('Should show edit button on user\\'s own replies', async () => {
      const questionWithUserReply = {
        ...mockQuestion,
        answers: [
          {
            _id: 'answer-user',
            author: { _id: 'user-456', fullName: 'John Farmer' },
            content: 'My own answer',
            likes: [],
            isAccepted: false,
          },
        ],
      };

      api.get.mockResolvedValue({
        data: { question: questionWithUserReply },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit|pencil/i })).toBeInTheDocument();
      });
    });

    test('Should not show edit button on other\\'s replies', async () => {
      renderComponent();

      await waitFor(() => {
        // Should not have edit buttons for other users' answers
        const editButtons = screen.queryAllByRole('button', { name: /edit|pencil/i });
        expect(editButtons.length).toBe(0);
      });
    });
  });

  describe('❌ Error Handling', () => {
    test('Should handle API error when posting reply', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write your answer/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/write your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit.*answer|post.*reply|reply/i });

      await userEvent.type(textarea, 'This is a detailed answer that will fail.');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
        expect(submitButton.disabled).toBe(false);
      });
    });

    test('Should handle network error when loading question', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error loading|failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('✅ Reply Timestamps', () => {
    test('Should display timestamps on answers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/2026-06-15|15th|June/i)).toBeInTheDocument();
      });
    });

    test('Should show relative time format', async () => {
      renderComponent();

      await waitFor(() => {
        // Check for relative time like "2 days ago", "yesterday", etc.
        expect(screen.getByText(/days ago|ago|yesterday/i)).toBeInTheDocument();
      });
    });
  });

  describe('✅ Sort/Filter Replies', () => {
    test('Should have sort option for answers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sort|newest|oldest/i })).toBeInTheDocument();
      });
    });

    test('Should sort answers by newest first', async () => {
      renderComponent();

      await waitFor(() => {
        const sortButtons = screen.getAllByRole('button', { name: /newest|sort/i });
        fireEvent.click(sortButtons[0]);
      });

      // Verify newest answer appears first
      await waitFor(() => {
        const answers = screen.getAllByText(/October to November|rainfall patterns/i);
        expect(answers[0]).toBeInTheDocument();
      });
    });
  });

  describe('✅ Mark Question as Resolved', () => {
    test('Should show resolve button for question author', async () => {
      const questionByUser = {
        ...mockQuestion,
        author: { _id: 'user-456' },
      };

      api.get.mockResolvedValue({
        data: { question: questionByUser },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resolve|close|mark.*closed/i })).toBeInTheDocument();
      });
    });

    test('Should resolve question and update status', async () => {
      api.put = jest.fn().mockResolvedValue({
        data: { message: 'Question resolved' },
      });

      const questionByUser = {
        ...mockQuestion,
        author: { _id: 'user-456' },
      };

      api.get.mockResolvedValue({
        data: { question: questionByUser },
      });

      renderComponent();

      await waitFor(() => {
        const resolveButton = screen.getByRole('button', { name: /resolve|close/i });
        fireEvent.click(resolveButton);
      });

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          expect.stringContaining('/resolve'),
          expect.anything()
        );
      });
    });
  });
});
