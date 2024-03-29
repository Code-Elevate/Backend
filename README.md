# CodeElevate Backend

## Deployment

This backend is designed to be deployed as a Docker container. It is recommended to use the provided `compose.yml` file to deploy the backend.

### Host System Package Dependencies

- Docker
- Docker Compose

### After system dependencies are installed, clone this repository:

```sh
git clone https://github.com/Code-Elevate/Backend
```

### Navigate to the repository

```sh
cd Backend
```

### Rename the `.env.example` file to `.env`

```sh
mv .env.example .env
```

### Edit the `.env` file

```sh
nano .env
```

While editing the `.env` file, make sure to fill in the REQUIRED fields. Without these fields, the backend will not work.

### Start the backend

```sh
docker compose up -d
```

## Additional Commands

### To view logs

```sh
docker compose logs backend
```

### To stop the backend

```sh
docker compose down
```

### To terminate the backend

```sh
docker compose stop backend
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
