FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    bash \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["bash"]
