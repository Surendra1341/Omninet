---
layout: home

hero:
  name: "OmniNet"
  text: "Distributed Microservices Platform"
  tagline: A production-grade platform built with Spring Boot, React, Kafka, gRPC, and Gemini AI.
  image:
    src: /hero-illustration.svg
    alt: OmniNet
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/Surendra1341/Omninet

features:
  - icon: 🔐
    title: Auth Service
    details: JWT authentication, OAuth2 (Google & GitHub), email OTP verification, Redis token blacklisting, and multi-device refresh token rotation.
  - icon: 📝
    title: Notes Service
    details: Rich notes CRUD with categories, file attachments, 30-day recycle bin, duplicate, pin, favourite, and full-text search.
  - icon: 🗂️
    title: Storage Service
    details: S3/MinIO integration with presigned upload/download URLs, folder hierarchies, direct multipart uploads, and per-user storage quotas.
  - icon: 🤖
    title: AI Service
    details: Gemini + Ollama AI chat with multi-session support, SSE token streaming, web-search tool calling, voice input (STT), and conversation memory.
  - icon: 🔀
    title: Event-Driven with Kafka
    details: Apache Kafka powers async user provisioning, storage auditing, note events, and todo reminders across all services.
  - icon: ⚡
    title: gRPC Inter-Service RPC
    details: Protobuf-defined gRPC services connect Auth, Storage, Notes, and AI with strong contracts and low-latency transport.
---
