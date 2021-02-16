# Feed Discovery Service

The Feed Discovery Service provides an autodiscovery for feed url.

## Install

```
npm install
```

## Usage

```
# normal mode
npm start

# dev mode with automatic restarts
npm run dev
```

By default the server is running on http://localhost:6666/.

### Examples

`POST /` with request body

```json
{
  "blogUrl": "https://tonyknvu.medium.com/"
}
```

will return response body

```json
{
  "feedUrls": ["https://medium.com/feed/@tonyknvu"]
}
```

## Docker

- To build and tag: `docker build . -t telescope_feed_discovery_svc:latest`
- To run locally: `docker run -p 6666:6666 telescope_feed_discovery_svc:latest`
