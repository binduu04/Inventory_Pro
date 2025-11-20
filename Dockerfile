FROM python:3.11-slim AS backend-builder
WORKDIR /app

# Install system tools
RUN apt-get update && apt-get install -y curl

# Copy backend
COPY backend ./backend

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r backend/requirements.txt


# -------- FRONTEND BUILD --------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend ./
RUN npm install
RUN npm run build


# -------- FINAL IMAGE --------
FROM python:3.11-slim
WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend

# Copy frontend build into backend/static
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install Python requirements again inside final image
RUN pip install --upgrade pip && \
    pip install -r backend/requirements.txt

# Expose port
ENV PORT=5000
EXPOSE 5000

# Command
CMD ["python", "backend/app.py"]
