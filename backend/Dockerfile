FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1 
ENV PATH="$POETRY_HOME/bin:$PATH"

RUN curl -sSL https://install.python-poetry.org | python3 -

# Copy dependency definition
COPY pyproject.toml poetry.lock ./

# Install dependencies (only main)
RUN poetry install --only main --no-root

# Copy application code
COPY . .

# Run application
CMD ["poetry", "run", "uvicorn", "cobblemon_academy_tracker_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
