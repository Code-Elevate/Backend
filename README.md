# CodeElevate Backend

This repository contains the backend for the CodeElevate project. The backend is a RESTful API that is designed to be used by the frontend of the CodeElevate project.

The API can be accessed at [https://code-elevate.gopalsaraf.com/api](https://code-elevate.gopalsaraf.com/api).

## Table of Contents

- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Additional Commands](#additional-commands)
- [License](#license)

## API Documentation

The API documentation can be found on [https://code-elevate.gopalsaraf.com/docs](https://code-elevate.gopalsaraf.com/docs) or [here](https://documenter.getpostman.com/view/30434267/2sA35G4hfM).

### API Routes

- `/users` - Routes starting with `/users` are used to manage users and their authentication. [More Info](https://documenter.getpostman.com/view/30434267/2sA35G4hfM#e82db6b6-1be6-4e67-aa37-c74407d9317e)

- `/manage` - Routes starting with `/manage` are used to manage contests and problems. [More Info](https://documenter.getpostman.com/view/30434267/2sA35G4hfM#f63844c8-0b5c-4beb-a1a4-34ac5787da95)

- `/contests` - Routes starting with `/contests` are used to get information about contests. [More Info](https://documenter.getpostman.com/view/30434267/2sA35G4hfM#35789fbc-4ea0-47e0-8d0b-e5478a9f1fd8)

- `/problems` - Routes starting with `/problems` are used to get information about problems. [More Info](https://documenter.getpostman.com/view/30434267/2sA35G4hfM#d47a10c2-2113-42cd-a10c-143fed3602ce)

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
