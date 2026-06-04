FROM python:3.11-slim

WORKDIR /app

COPY docker/simulador/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY simulador/ .

CMD ["python", "main.py"]