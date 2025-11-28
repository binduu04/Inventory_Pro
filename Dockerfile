# # FROM python:3.11-slim AS backend-builder
# # WORKDIR /app

# # # Install system tools
# # RUN apt-get update && apt-get install -y curl

# # # Copy backend
# # COPY backend ./backend

# # # Install Python dependencies
# # RUN pip install --upgrade pip && \
# #     pip install -r backend/requirements.txt


# # # -------- FRONTEND BUILD --------
# # FROM node:18-alpine AS frontend-builder
# # WORKDIR /app/frontend
# # COPY frontend ./
# # RUN npm install
# # RUN npm run build


# # # -------- FINAL IMAGE --------
# # FROM python:3.11-slim
# # WORKDIR /app

# # # Copy backend from builder
# # COPY --from=backend-builder /app/backend ./backend

# # # Copy frontend build into backend/static
# # COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# # # Install Python requirements again inside final image
# # RUN pip install --upgrade pip && \
# #     pip install -r backend/requirements.txt

# # # Expose port
# # ENV PORT=5000
# # EXPOSE 5000

# # # Command
# # CMD ["python", "backend/app.py"]
# # ---------- BACKEND BUILDER ----------
# FROM python:3.11-slim AS backend-builder
# WORKDIR /app

# COPY backend ./backend
# RUN pip install --upgrade pip && pip install -r backend/requirements.txt

# # ---------- FRONTEND BUILDER ----------
# FROM node:18-alpine AS frontend-builder
# WORKDIR /app/frontend
# COPY frontend .
# RUN npm install && npm run build

# # ---------- FINAL IMAGE ----------
# FROM python:3.11-slim
# WORKDIR /app

# # Copy backend app
# COPY --from=backend-builder /app/backend ./backend

# # Copy frontend build output directly inside backend/dist
# COPY --from=frontend-builder /app/frontend/dist ./backend/dist

# RUN pip install --upgrade pip && pip install -r backend/requirements.txt

# ENV PORT=5000
# EXPOSE 5000

# CMD ["python", "backend/app.py"]


# ---------- BACKEND BUILDER ----------
FROM python:3.11-slim AS backend-builder
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend ./backend

# ---------- FRONTEND BUILDER ----------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend .
RUN npm install && npm run build

# ---------- FINAL IMAGE ----------
FROM python:3.11-slim
WORKDIR /app

# Copy backend app
COPY --from=backend-builder /app/backend ./backend

# Copy already installed dependencies (from builder layer)
COPY --from=backend-builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy frontend build output directly inside backend/dist
COPY --from=frontend-builder /app/frontend/dist ./backend/dist

ENV PORT=5000
EXPOSE 5000

CMD ["python", "backend/app.py"]
