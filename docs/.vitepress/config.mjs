import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OmniNet',
  description: 'A production-grade distributed microservices platform — Notes, Storage, AI Chat, and more.',
  base: '/Omninet/',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/Omninet/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'OmniNet Docs' }],
    ['meta', { property: 'og:description', content: 'Distributed microservices platform documentation' }],
  ],

  themeConfig: {
    logo: { light: '/logo-light.svg', dark: '/logo-dark.svg', alt: 'OmniNet' },
    siteTitle: 'OmniNet',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Services', link: '/services/auth-service' },
      { text: 'Frontend', link: '/frontend/overview' },
      { text: 'Deployment', link: '/deployment/local' },
      {
        text: 'GitHub',
        link: 'https://github.com/Surendra1341/Omninet',
        target: '_blank',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quickstart' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/architecture/overview' },
            { text: 'Module Inventory', link: '/architecture/modules' },
            { text: 'Inter-Service Communication', link: '/architecture/communication' },
            { text: 'Event Streaming (Kafka)', link: '/architecture/kafka' },
          ],
        },
      ],
      '/services/': [
        {
          text: 'Microservices',
          items: [
            { text: 'Auth Service', link: '/services/auth-service' },
            { text: 'API Gateway', link: '/services/api-gateway' },
            { text: 'Notes Service', link: '/services/notes-service' },
            { text: 'Storage Service', link: '/services/storage-service' },
            { text: 'AI Service', link: '/services/ai-service' },
          ],
        },
      ],
      '/frontend/': [
        {
          text: 'Frontend',
          items: [
            { text: 'Overview', link: '/frontend/overview' },
            { text: 'Pages & Features', link: '/frontend/pages' },
            { text: 'State Management', link: '/frontend/state' },
            { text: 'AI Chat UI', link: '/frontend/ai-chat' },
          ],
        },
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [
            { text: 'Local Development', link: '/deployment/local' },
            { text: 'Docker Compose', link: '/deployment/docker' },
            { text: 'Docker Swarm (Production)', link: '/deployment/swarm' },
            { text: 'Troubleshooting', link: '/deployment/troubleshooting' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Surendra1341/Omninet' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 OmniNet Contributors',
    },

    editLink: {
      pattern: 'https://github.com/Surendra1341/Omninet/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },

  markdown: {
    lineNumbers: true,
  },
})
