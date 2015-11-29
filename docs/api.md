# Pandoc API

* Use headers when requesting

    * `Content-Type: application/json`
    * `Accept: application/json`

* Prefer HTTPS

## Environments

* `qa` https://pandoc-api-qa.herokuapp.com/api/v1

    Used for playing around and testing.

* `prod` https://pandoc-api-prod.herokuapp.com/api/v1

    Stable.

## Endpoints

All API endpoints. They are relative to the base urls listed in [environments](#environments).

### `GET /pandoc` Convert document with Pandoc

**Parameters**

Name           | Type      | Description
-------------- | --------- | -----------
**source**     | *String*  |  **Required.** Url to the input document.

## Error handling

When HTTP status code is 400 or higher, response is in format:

```json
{
  "error": {
    "message": "Internal Server Error"
  }
}
```
