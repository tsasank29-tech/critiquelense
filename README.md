# CritiqueLens AI 📷

Built for the **Meta Global AI Developer Hackathon**. CritiqueLens AI delivers instant positive/negative photographic feedback with zero-latency 60 FPS hover corrections and precise region segmentation powered by Meta's model suite (**SAM 3.1**, **Muse Spark 1.3**, and **Muse Wonder**).

## 🚀 Architecture for 1M+ Scale
- **Redis Caching Layer:** Caches image analysis hashes to bypass redundant model API calls, ensuring <10ms response times for repeat views.
- **Client-Side Canvas Compositing:** Applies instant exposure and optical filter matrices on hover without server round-trips.
- **Horizontal Scaling:** Stateless Node.js backend containerized with Docker, deployable behind any load balancer or Kubernetes cluster.

## 🛠️ Quickstart & Deployment

1. Clone the repository and configure environment variables:
   ```bash
   cp .env.example .env
   # Add your Meta Model API Key to .env
   ```

2. Spin up the production stack using Docker Compose:
   ```bash
   docker-compose up --build -d
   ```

3. Access the application at `http://localhost:3000`.
