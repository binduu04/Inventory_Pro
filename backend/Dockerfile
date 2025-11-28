FROM python:3.11-slim
RUN apt-get update && apt-get install -y libgomp1
WORKDIR /app

COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

ENV PORT=5000
EXPOSE 5000

CMD ["python", "app.py"]
