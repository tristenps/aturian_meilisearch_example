# MeiliSearch with Nodejs Endpoints/validation

## Instructions to Run
```bash
git clone https://github.com/tristenps/aturian_meilisearch_example.git
mv .env.example .env
docker-compose up -d
```
Note: this will create a peristant datafile within the cloned repo.

## API Endpoints

### Indexes
#### Create an index
##### POST: http://localhost:80/api/v1/index/
Request Body:
```
{
  "indexName" : "orders", // Required, provides name for index
  "primaryKey" : "doc_id" // Required, primaryKey will be used for update and uniqueness
}
```
#### List all indices
##### GET: http://localhost:80/api/v1/index/
This will return all created indices.

### Documents
#### Add a document
You will need to have created an index before you can post/get any documents.
##### POST: http://localhost:80/api/v1/:indexName/documents
Request Body:
```
{
  "documents": [
    {
      "doc_id": "12345", // Required
      "client_id": "abc", // Required
      "doc_type": "order", // Required
      ... // All key-value pairs for the document that will be retained and searched through
    } // Optionally include as many documents as you want, limit of 20mb packet size
  ]
}
```
#### Get all documents within an index
##### GET: http://localhost:80/api/v1/:indexName/documents
```
{
  "limit": 30 // Optional, defaults to return first 50 documents
}
```

### Search
#### Run a search and get documents
##### GET: http://localhost:80/api/v1/:indexName/search
```
{
  "searchParams": {
    "query": "1234",
    "offset": 10, // Optional
    "limit": 50, // Optional  
    "filters": "cust_name = "Alpha Pharmaceuticals"", // Optional
    "facetFilters": [{client_id:abc}] // Optional: Indexes are only created with facet filters on required doc fields
  }
}
```
#### FacetFilters
Facet filters are currently set for doc_id, client_id, and doc_type for all indices. 

## MeiliSearch
Meilisearch can be accessed at http://localhost:81 for both their web interface and API requests
