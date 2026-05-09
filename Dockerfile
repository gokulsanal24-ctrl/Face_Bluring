FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHON_COMMAND=python
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY processor/requirements.txt processor/requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r processor/requirements.txt

COPY . .

RUN mkdir -p uploads outputs

EXPOSE 3000

CMD ["npm", "start"]
