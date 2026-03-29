FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY django-backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY django-backend/ /app/

COPY django-backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE ${PORT:-8000}

ENTRYPOINT ["/entrypoint.sh"]
CMD ["sh", "-c", "gunicorn kardh.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
