FROM python:3.11-slim

WORKDIR /app

COPY . .
COPY kirana_sales_data_v2.3_production_discount.csv ./backend/

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

ENV PORT=5000
EXPOSE 5000

CMD ["python", "app.py"]
