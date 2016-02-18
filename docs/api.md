# Pandoc API

* Use headers when requesting

    * `Content-Type: application/json`
    * `Accept: application/json`

* Prefer HTTPS

## Environments

* `qa` https://pandoc-api-qa.herokuapp.com/

    Used for playing around and testing.

* `prod` https://pandoc-api-prod.herokuapp.com/

    Stable.

## Endpoints

All API endpoints. They are relative to the base urls listed in [environments](#environments).

### `GET /convert` Convert document with Pandoc

**Query parameters**

Name           | Type      | Description
-------------- | --------- | -----------
**url**        | *String*  |  **Required.** Url to the input document.

## Error handling

When HTTP status code is 400 or higher, response is in format:

```json
{
  "error": {
    "message": "Internal Server Error"
  }
}
```
