import { Post, Reel, Tool, User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'alex_ai',
    email: 'alex@example.com',
    profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'AI enthusiast & prompt engineer',
    verified: true
  },
  {
    id: '2',
    username: 'sarah_creative',
    email: 'sarah@example.com',
    profileImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Creative director using AI tools',
    verified: false
  },
  {
    id: '3',
    username: 'mike_dev',
    email: 'mike@example.com',
    profileImage: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Developer exploring AI workflows'
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Perfect Portrait Photography Prompt',
    description: 'Get stunning professional portraits with this detailed prompt',
    prompt: 'Professional headshot portrait of a confident business person, studio lighting, sharp focus, high resolution, modern business attire, neutral background, photo-realistic',
    tags: ['photography', 'portrait', 'professional'],
    media: {
      type: 'image',
      urls: ['https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800']
    },
    allowCopyPrompt: true,
    author: mockUsers[0],
    likes: 124,
    comments: 23,
    saves: 67,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Cinematic Storytelling for Videos',
    description: 'Create compelling narratives with this storytelling framework',
    prompt: 'Create a cinematic short story about [topic] with dramatic lighting, emotional depth, compelling character development, and a twist ending. Focus on visual storytelling techniques.',
    tags: ['storytelling', 'video', 'cinematic'],
    media: {
      type: 'video',
      urls: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4']
    },
    allowCopyPrompt: true,
    author: mockUsers[1],
    likes: 89,
    comments: 15,
    saves: 45,
    createdAt: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    title: 'Logo Design Inspiration',
    description: 'Multiple variations for modern logo concepts',
    prompt: 'Modern minimalist logo design for [company name], clean lines, geometric shapes, professional color palette, scalable vector format',
    tags: ['design', 'logo', 'branding'],
    media: {
      type: 'carousel',
      urls: [
        'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/109371/pexels-photo-109371.jpeg?auto=compress&cs=tinysrgb&w=800'
      ]
    },
    allowCopyPrompt: true,
    author: mockUsers[2],
    likes: 156,
    comments: 28,
    saves: 92,
    createdAt: '2024-01-13T09:20:00Z'
  }
];

export const mockReels: Reel[] = [
  {
    id: '1',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    prompt: 'Quick animation showing [process] with smooth transitions, bright colors, and engaging visual elements',
    title: 'Smooth Animation Tutorial',
    tags: ['animation', 'tutorial', 'motion'],
    author: mockUsers[0],
    likes: 234,
    comments: 45,
    saves: 78,
    createdAt: '2024-01-15T14:20:00Z',
    allowCopyPrompt: true
  },
  {
    id: '2',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    prompt: 'Time-lapse of [creative process] with dramatic lighting and close-up shots',
    title: 'Creative Process Timelapse',
    tags: ['timelapse', 'creative', 'process'],
    author: mockUsers[1],
    likes: 189,
    comments: 32,
    saves: 56,
    createdAt: '2024-01-14T11:30:00Z',
    allowCopyPrompt: true
  }
];

export const mockTools: Tool[] = [
  {
    id: '1',
    name: 'MidJourney',
    logo: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=100',
    websiteUrl: 'https://midjourney.com',
    description: 'AI-powered image generation tool for creating stunning artwork and designs.',
    category: 'Image Generation',
    tags: ['ai', 'image', 'art', 'design'],
    author: mockUsers[0],
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    name: 'ChatGPT',
    logo: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=100',
    websiteUrl: 'https://chat.openai.com',
    description: 'Advanced language model for text generation, coding, and creative writing.',
    category: 'Text Generation',
    tags: ['ai', 'text', 'writing', 'coding'],
    author: mockUsers[1],
    createdAt: '2024-01-09T14:30:00Z'
  },
  {
    id: '3',
    name: 'Runway',
    logo: 'https://images.pexels.com/photos/3585047/pexels-photo-3585047.jpeg?auto=compress&cs=tinysrgb&w=100',
    websiteUrl: 'https://runwayml.com',
    description: 'AI video editing and generation platform for creators and filmmakers.',
    category: 'Video Generation',
    tags: ['ai', 'video', 'editing', 'generation'],
    author: mockUsers[2],
    createdAt: '2024-01-08T16:45:00Z'
  }
];