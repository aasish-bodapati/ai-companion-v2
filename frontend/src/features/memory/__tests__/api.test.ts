import { createMemory } from '@/features/memory/api';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('memory api - createMemory', () => {
  it('posts to /memory/memories with the provided body', async () => {
    const body = {
      content: 'test content',
      content_type: 'message',
      conversation_id: 'conv-1',
      importance_score: 80,
      source: 'chat:remember',
    } as const;

    (api.post as jest.Mock).mockResolvedValue({ id: 'm1', ...body, user_id: 'u1', timestamp: new Date().toISOString() });

    const res = await createMemory(body);

    expect(api.post).toHaveBeenCalledWith('/memory/memories', body);
    expect(res).toHaveProperty('id', 'm1');
  });
});
